/* ==========================================================
   neV.BOOSTER — server/mail.js
   Envoi de courriels par SMTP, sans aucune dépendance (modules intégrés net / tls).

   Réglage par variables d'environnement :
     NEV_SMTP_HOST   serveur SMTP (ex. smtp.gmail.com, smtp.brevo.com, ssl0.ovh.net…)
     NEV_SMTP_PORT   587 (STARTTLS, défaut) ou 465 (TLS direct)
     NEV_SMTP_USER   identifiant (souvent l'adresse e-mail)
     NEV_SMTP_PASS   mot de passe ou « mot de passe d'application »
     NEV_SMTP_FROM   expéditeur affiché, ex. "neV.BOOSTER <contact@ton-site.com>"
   Sans NEV_SMTP_HOST, rien n'est envoyé : les messages restent dans la « boîte d'envoi »
   de l'admin (avec leur lien), pour que tu puisses les transmettre toi-même.
   ========================================================== */
'use strict';
const net = require('net');
const tls = require('tls');
const os = require('os');

const cfg = () => {
  const host = String(process.env.NEV_SMTP_HOST || '').trim();
  const port = Number(process.env.NEV_SMTP_PORT) || 587;
  return {
    host, port, user: process.env.NEV_SMTP_USER || '', pass: process.env.NEV_SMTP_PASS || '',
    from: process.env.NEV_SMTP_FROM || process.env.NEV_SMTP_USER || ('neV.BOOSTER <no-reply@' + (host || 'localhost') + '>'),
    secure: port === 465 || /^(ssl|tls)$/i.test(process.env.NEV_SMTP_SECURE || ''),
    insecure: process.env.NEV_SMTP_INSECURE_TLS === '1' // uniquement pour les tests locaux
  };
};
const configured = () => !!cfg().host;

const b64 = (s) => Buffer.from(String(s), 'utf8').toString('base64');
const addrOf = (s) => { const m = String(s).match(/<([^>]+)>/); return (m ? m[1] : String(s)).trim(); };
const safeHdr = (s) => String(s).replace(/[\r\n]+/g, ' ').trim();
const encHdr = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : '=?UTF-8?B?' + b64(s) + '?=');

function build(c, m) {
  const body = String(m.text).replace(/\r?\n/g, '\r\n');
  const wrapped = b64(body).replace(/(.{76})/g, '$1\r\n');
  const id = '<' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) + '@' + (os.hostname() || 'nev') + '>';
  const from = safeHdr(c.from), fromAddr = addrOf(from);
  const display = from.replace(/<[^>]+>/, '').replace(/["']/g, '').trim();
  const fromHdr = display ? encHdr(display) + ' <' + fromAddr + '>' : fromAddr;
  return ['From: ' + fromHdr, 'To: ' + addrOf(m.to), 'Subject: ' + encHdr(safeHdr(m.subject)), 'Date: ' + new Date().toUTCString(), 'Message-ID: ' + id,
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', 'Auto-Submitted: auto-generated', '', wrapped].join('\r\n');
}

/* Petit client SMTP : une conversation = une promesse. */
function send(m, override) {
  const c = Object.assign(cfg(), override || {});
  if (!c.host) return Promise.reject(new Error('SMTP non configuré (NEV_SMTP_HOST).'));
  const rcpt = addrOf(m.to);
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(rcpt)) return Promise.reject(new Error('Adresse destinataire invalide.'));
  return new Promise((resolve, reject) => {
    let sock, buf = '', waiting = null, done = false, tlsOn = c.secure;
    const fail = (e) => { if (done) return; done = true; try { sock.destroy(); } catch (x) { /* ignoré */ } reject(e instanceof Error ? e : new Error(String(e))); };
    const timer = setTimeout(() => fail(new Error('Délai dépassé (SMTP).')), 20000);
    const finish = () => { if (done) return; done = true; clearTimeout(timer); try { sock.end(); } catch (x) { /* ignoré */ } resolve(true); };
    function attach(s) {
      sock = s; buf = '';
      s.on('data', (d) => {
        buf += d.toString('utf8');
        for (;;) { // une réponse = lignes « 250-… » puis « 250 … »
          const m2 = buf.match(/^(?:\d{3}-.*\r?\n)*\d{3} .*\r?\n/);
          if (!m2) break;
          const block = m2[0]; buf = buf.slice(block.length);
          const code = Number(block.slice(0, 3));
          if (waiting) { const w = waiting; waiting = null; w({ code, text: block }); }
        }
      });
      s.on('error', fail);
      s.on('close', () => { if (!done) fail(new Error('Connexion SMTP fermée.')); });
    }
    const read = () => new Promise((r) => { waiting = r; });
    const cmd = (line, ok) => { sock.write(line + '\r\n'); return read().then((r) => { if (ok.indexOf(r.code) < 0) throw new Error('SMTP ' + r.code + ' : ' + r.text.replace(/\s+/g, ' ').slice(0, 120)); return r; }); };
    const opts = { host: c.host, port: c.port, servername: /^[\d.:]+$/.test(c.host) ? undefined : c.host, rejectUnauthorized: !c.insecure };
    const start = () => {
      const greeting = read();
      (async () => {
        const g = await greeting; if (g.code !== 220) throw new Error('SMTP ' + g.code);
        let r = await cmd('EHLO ' + (os.hostname() || 'neVBOOSTER').replace(/[^\w.-]/g, '') , [250]);
        if (!tlsOn && /STARTTLS/i.test(r.text)) {
          await cmd('STARTTLS', [220]);
          sock.removeAllListeners('data'); sock.removeAllListeners('close');
          await new Promise((ok, ko) => { const t = tls.connect(Object.assign({ socket: sock }, opts), () => ok(t)); t.once('error', ko); attach(t); });
          tlsOn = true;
          r = await cmd('EHLO ' + (os.hostname() || 'neVBOOSTER').replace(/[^\w.-]/g, ''), [250]);
        } else if (!tlsOn && c.user && !c.insecure && !/^(127\.|localhost|::1)/.test(c.host)) {
          throw new Error('Le serveur SMTP ne propose pas le chiffrement STARTTLS : envoi refusé pour protéger le mot de passe.');
        }
        if (c.user) {
          if (/AUTH[^\n]*PLAIN/i.test(r.text)) await cmd('AUTH PLAIN ' + b64('\0' + c.user + '\0' + c.pass), [235]);
          else { await cmd('AUTH LOGIN', [334]); await cmd(b64(c.user), [334]); await cmd(b64(c.pass), [235]); }
        }
        await cmd('MAIL FROM:<' + addrOf(c.from) + '>', [250]);
        await cmd('RCPT TO:<' + rcpt + '>', [250, 251]);
        await cmd('DATA', [354]);
        const data = build(c, m).replace(/^\./gm, '..');
        await cmd(data + '\r\n.', [250]);
        try { sock.write('QUIT\r\n'); } catch (x) { /* ignoré */ }
        finish();
      })().catch(fail);
    };
    try {
      if (c.secure) { const t = tls.connect(opts, start); attach(t); t.on('error', fail); }
      else { const s = net.connect({ host: c.host, port: c.port }, start); attach(s); }
    } catch (e) { fail(e); }
  });
}

module.exports = { send, configured, cfg, build };
