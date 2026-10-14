(function(){
"use strict";
var NS="http://www.w3.org/2000/svg";
var GROUPS={push:"Pectoraux & épaules",tri:"Triceps",back:"Dos",legs:"Cuisses & fessiers",abs:"Abdos & gainage",arm:"Biceps & avant-bras",cardio:"Cardio",mob:"Mobilité"};
var CATLABEL={push:"Pompes",abs:"Abdos",legs:"Jambes",tri:"Triceps",arm:"Avant-bras"};
var LEVEL=["","Facile","Moyen","Difficile"];

function chair(a,b,y){return '<path d="M'+a+' '+y+'H'+b+'M'+(a+2)+' '+y+'V72M'+(b-2)+' '+y+'V72"/>';}
function wall(x){return '<path d="M'+x+' 0V72"/>';}
var STEP='<path d="M66 60H94V72M66 60V72"/>';

/* pose = head, neck, hip, elbow, wrist, knee, foot [+ far knee, far foot] [+ hand tip]. Facing right. */
var STAND=[60,14,60,24,60,44,61,34,62,44,60,58,60,72];
var SQUAT_A=[60,14,60,24,60,44,70,24,80,24,60,58,60,72];
var SQUAT_B=[69,35,66,42,58,58,76,40,86,42,72,60,60,72];
var PLANK=[96,45,88,48,56,59,88,59,88,70,40,64.5,24,70];

var E=[
{id:"pompes-classiques",n:"Pompes classiques",g:"push",m:"Pectoraux, triceps, épaules",l:2,r:"8 à 15 répétitions",
 s:["Mains au sol, un peu plus larges que les épaules, corps aligné de la tête aux talons.","Plie les coudes pour descendre la poitrine près du sol.","Pousse fort pour remonter bras tendus, sans cambrer le dos."],
 e:["Bassin qui s’affaisse ou qui monte.","Coudes écartés à angle droit du corps."],f:"Pompes sur les genoux ou contre un mur.",
 k:[[96,45,88,48,56,59,88,59,88,70,40,64.5,24,70],[96,60,88,62,56,66,72,64,88,70,40,68,24,70]],cat:"push",c:1},
{id:"pompes-inclinees",n:"Pompes inclinées",g:"push",m:"Pectoraux, triceps",l:1,r:"10 à 20 répétitions",
 s:["Pose les mains sur un support solide (banc, table lourde), un peu plus larges que les épaules.","Corps en ligne droite, descends la poitrine vers le support.","Repousse jusqu’aux bras tendus."],
 e:["Support qui bouge : choisis-en un stable.","Dos creusé."],f:"Monte encore le support, jusqu’à un mur.",
 k:[[96,31,88,34,56,52,90,45,92,56,40,61,24,70],[94,46,86,48,56,59,76,54,92,56,40,64.5,24,70]],pr:chair(90,114,56),cat:"push",c:1.3},
{id:"pompes-pike",n:"Pompes pike",g:"push",m:"Épaules, triceps",l:3,r:"5 à 10 répétitions",
 s:["Mains au sol, hanches levées pour former un V inversé.","Plie les coudes pour amener le haut de la tête entre les mains.","Pousse pour revenir en V."],
 e:["Poser la tête lourdement au sol.","Jambes trop pliées : garde-les presque tendues."],f:"Pieds plus écartés et descente partielle.",
 k:[[74,51,70,46,52,26,75,57,80,70,40,49,28,70],[83,64,76,60,52,30,66,66,80,70,40,50,28,70]],cat:"push",c:0.5},
{id:"pompes-genoux",n:"Pompes sur les genoux",g:"push",m:"Pectoraux, triceps, épaules",l:1,r:"8 à 15 répétitions",
 s:["Genoux au sol, mains sous les épaules, corps aligné des genoux à la tête.","Descends en contrôlant le mouvement.","Remonte sans cambrer le dos."],
 e:["Fesses qui reculent.","Descente trop rapide."],f:"Pompes inclinées sur un support.",
 k:[[96,45,88,48,70,58,88,59,88,70,50,70,36,60],[96,60,88,62,68,66,74,67,88,70,50,70,36,63]],cat:"push",c:1.2},
{id:"pompes-prise",n:"Pompes prise rapprochée",g:"push",m:"Triceps, pectoraux",l:2,r:"6 à 12 répétitions",
 s:["Mains sous la poitrine, rapprochées sans forcément se toucher.","Garde les coudes près du corps pendant la descente.","Pousse jusqu’à l’extension complète."],
 e:["Coudes qui s’ouvrent.","Poignets crispés : tourne légèrement les mains."],f:"Même mouvement sur les genoux.",
 k:[[92,45,84,48,54,59,84,59,82,70,39,64.5,24,70],[92,60,84,62,54,66,68,66,82,70,39,68,24,70]],cat:"push",c:0.7},
{id:"pompes-declinees",n:"Pompes déclinées",g:"push",m:"Haut des pectoraux, épaules",l:3,r:"5 à 10 répétitions",
 s:["Pose les pieds sur une chaise stable, mains au sol.","Garde le corps gainé et descends la poitrine.","Remonte sans lever le bassin."],
 e:["Chaise qui glisse : cale-la contre un mur.","Hanches qui montent."],f:"Pieds sur une marche basse.",
 k:[[96,53,88,50,56,48,88,60,88,70,40,47,24,46],[96,65,88,62,56,54,72,66,88,70,40,50,24,46]],pr:chair(10,30,46),cat:"push",c:0.7},
{id:"pompes-mur",n:"Pompes contre un mur",g:"push",m:"Pectoraux, triceps",l:1,r:"12 à 20 répétitions",
 s:["Face au mur, mains à hauteur d’épaules, pieds reculés.","Plie les coudes pour approcher la poitrine du mur.","Repousse jusqu’aux bras tendus."],
 e:["Pieds trop près du mur.","Épaules qui montent vers les oreilles."],f:"Rapproche les pieds du mur.",
 k:[[90,23,84,28,70,48,92,32,100,36,63,60,56,72],[97,28,93,32,75,50,86,38,100,36,66,61,56,72]],pr:wall(103)},
{id:"dips-chaise",n:"Dips sur chaise",g:"tri",m:"Triceps, épaules",l:2,r:"8 à 15 répétitions",
 s:["Assieds-toi au bord d’une chaise stable, mains à côté des hanches, genoux pliés.","Décolle les fesses et descends en pliant les coudes vers l’arrière, dos près de la chaise.","Pousse avec les triceps pour remonter."],
 e:["Descendre trop bas : arrête-toi quand les coudes arrivent à 90°.","Épaules qui montent : garde-les basses."],f:"Genoux très pliés, pieds près du corps, descente courte.",
 warn:"Cet exercice est exigeant pour les épaules. Si tu ressens une gêne, passe à la variante facile ou à une autre carte.",
 k:[[47,18,46,28,50,50,44,39,42,50,70,54,78,72],[47,30,46,40,50,62,36,44,42,50,70,58,78,72]],pr:chair(14,44,50),cat:"tri",c:2},
{id:"extension-sac",n:"Extension triceps derrière la tête",g:"tri",m:"Triceps",l:1,r:"10 à 15 répétitions",
 s:["Tiens un sac léger, bien fermé, à deux mains au-dessus de la tête.","Plie les coudes pour descendre le sac derrière la tête.","Tends les bras sans bouger les coudes."],
 e:["Coudes qui s’écartent.","Sac trop lourd."],f:"Bouteille d’eau à la place du sac.",
 k:[[60,14,60,24,60,44,57,12,57,3,60,58,60,72],[60,14,60,24,60,44,57,12,50,20,60,58,60,72]],bag:"w",cat:"tri",c:1.2},
{id:"kickback",n:"Kickback triceps",g:"tri",m:"Triceps",l:1,r:"10 à 15 par bras",
 s:["Penche le buste dos droit, coude plié et collé au corps, sac léger en main.","Tends l’avant-bras vers l’arrière sans bouger le coude.","Reviens lentement."],
 e:["Coude qui descend.","Balancer le buste."],f:"Bouteille d’eau à la place du sac.",
 k:[[82,35,74,36,48,46,62,43,62,55,48,58,46,72],[82,35,74,36,48,46,62,43,48,42,48,58,46,72]],bag:"w",cat:"tri",c:1.2,side:1},
{id:"sphinx",n:"Pompes sphinx",g:"tri",m:"Triceps, épaules",l:3,r:"5 à 10 répétitions",
 s:["Position de planche sur les avant-bras.","Pousse sur les mains pour tendre les bras et remonter le corps.","Redescends sur les avant-bras avec contrôle."],
 e:["Bassin qui monte.","Poignets douloureux : tourne légèrement les mains."],f:"Même mouvement avec les genoux au sol.",
 k:[[96,62,86,62,54,67,84,67,98,69,40,68.5,24,70],[94,48,86,50,54,60,90,60,98,70,40,65,24,70]],cat:"tri",c:0.8},
{id:"superman",n:"Superman",g:"back",m:"Bas du dos, fessiers",l:1,r:"8 à 12 répétitions, tenue 2 s",
 s:["Allonge-toi sur le ventre, bras tendus devant toi.","Lève légèrement bras, poitrine et jambes.","Tiens 1 à 2 secondes, puis relâche."],
 e:["Lever trop haut la tête.","Forcer sur le bas du dos."],f:"Lève seulement les bras, ou seulement les jambes.",
 k:[[90,66,80,67,52,68,96,66,108,66,36,68,20,68],[90,59,80,63,52,68,96,58,108,54,36,63,20,58]]},
{id:"bird-dog",n:"Bird-dog",g:"back",m:"Dos, abdominaux, stabilité",l:1,r:"8 par côté",
 s:["À quatre pattes, mains sous les épaules, genoux sous les hanches.","Tends un bras et la jambe opposée.","Reviens au centre et change de côté."],
 e:["Bassin qui tourne.","Dos creusé."],f:"Tends seulement la jambe.",
 k:[[86,52,78,54,50,54,79,62,80,70,50,70,34,70],[86,52,78,54,50,54,92,52,106,50,34,54,18,52]]},
{id:"anges-inverses",n:"Anges inversés au sol",g:"back",m:"Arrière des épaules, haut du dos",l:2,r:"10 à 12 répétitions",
 s:["Allonge-toi sur le ventre, bras le long du corps.","Ouvre les bras sur les côtés, puis vers le haut.","Reviens lentement en gardant les épaules basses."],
 e:["Épaules vers les oreilles.","Front écrasé au sol."],f:"Réduis l’amplitude du mouvement.",
 k:[[90,66,80,67,52,68,66,67,54,67,36,68,20,68],[90,63,80,65,52,68,96,66,108,66,36,68,20,68]]},
{id:"rowing-sac",n:"Rowing avec sac à dos léger",g:"back",m:"Dos, biceps",l:2,r:"10 à 15 par bras",
 s:["Penche le buste dos droit, sac léger et fermé en main.","Tire le coude vers la hanche.","Redescends lentement."],
 e:["Dos rond.","Élan avec tout le corps."],f:"Sac plus léger ou bouteille d’eau.",
 warn:"Évite le rowing sous une table ou les tractions improvisées si le meuble n’est pas fait pour porter ton poids.",
 k:[[80,35,72,36,46,46,72,48,72,58,46,59,46,72],[80,35,72,36,46,46,60,42,68,48,46,59,46,72]],bag:"w",side:1},
{id:"nage-sol",n:"Nage au sol",g:"back",m:"Dos, fessiers",l:1,r:"20 alternances",
 s:["Allonge-toi sur le ventre, bras et jambes tendus.","Lève un bras et la jambe opposée.","Alterne à rythme calme."],
 e:["Mouvements trop rapides.","Nuque en hyperextension."],f:"Alterne sans lever haut.",
 k:[[90,62,80,64,52,68,96,62,108,58,36,67,20,63],[90,65,80,66,52,68,96,67,108,68,36,68,20,68]]},
{id:"good-morning",n:"Good morning",g:"back",m:"Bas du dos, arrière des cuisses",l:2,r:"10 à 12 répétitions",
 s:["Debout, mains derrière la tête, genoux souples.","Recule les hanches et penche le buste dos droit.","Remonte en serrant les fessiers."],
 e:["Dos arrondi.","Descente trop profonde."],f:"Bras croisés sur la poitrine, amplitude réduite.",
 k:[[60,14,60,24,60,44,53,22,59,15,60,58,60,72],[78,38,70,40,54,46,70,32,76,36,55,59,54,72]]},
{id:"squats",n:"Squats",g:"legs",m:"Quadriceps, fessiers",l:1,r:"10 à 20 répétitions",
 s:["Pieds à largeur d’épaules, bras devant toi.","Recule les hanches et plie les genoux.","Pousse sur les pieds pour te redresser."],
 e:["Genoux qui rentrent vers l’intérieur.","Talons qui décollent."],f:"Squat en t’asseyant sur une chaise.",
 k:[SQUAT_A,SQUAT_B],cat:"legs",c:0.5},
{id:"fentes",n:"Fentes arrière",g:"legs",m:"Cuisses, fessiers, équilibre",l:2,r:"8 à 12 par jambe",
 s:["Debout, pieds joints.","Recule un pied et fléchis les deux genoux sans heurter le sol.","Reviens debout et alterne."],
 e:["Pas trop court.","Buste penché en avant."],f:"Tiens-toi à un mur pour l’équilibre.",
 k:[[60,14,60,24,60,44,62,34,60,43,60,58,60,72,60,58,60,72],[58,22,58,32,58,50,62,42,60,50,70,60,68,72,48,64,36,72]],cat:"legs",c:0.4,side:1},
{id:"chaise-mur",n:"Chaise contre le mur",g:"legs",m:"Quadriceps, fessiers",l:2,r:"20 à 45 secondes",
 s:["Plaque le dos au mur, avance légèrement les pieds.","Glisse jusqu’à ce que les cuisses approchent l’horizontale.","Tiens la position en respirant."],
 e:["Genoux qui dépassent les orteils.","Mains posées sur les cuisses."],f:"Descends moins bas.",
 k:[[46,14,44,24,44,44,50,36,54,46,48,58,52,72],[46,29,44,38,44,58,50,48,58,56,60,58,60,72]],pr:wall(38),cat:"legs",c:3,u:"s"},
{id:"pont-fessier",n:"Pont fessier",g:"legs",m:"Fessiers, arrière des cuisses",l:1,r:"12 à 20 répétitions",
 s:["Allonge-toi sur le dos, genoux pliés et pieds au sol.","Lève le bassin en serrant doucement les fessiers.","Redescends lentement."],
 e:["Dos creusé en haut du mouvement.","Pieds trop éloignés."],f:"Monte moins haut.",
 k:[[18,66,28,68,50,68,40,69,52,69,64,56,72,70],[18,66,28,68,52,54,40,69,52,69,68,52,72,70]],cat:"legs",c:0.8},
{id:"mollets",n:"Extensions des mollets",g:"legs",m:"Mollets",l:1,r:"15 à 25 répétitions",
 s:["Debout, une main posée sur un mur pour l’équilibre.","Monte sur la pointe des pieds, pause d’une seconde.","Redescends lentement."],
 e:["Chevilles qui basculent vers l’extérieur.","Rebond sans contrôle."],f:"Appui des deux mains.",
 k:[STAND,[60,8,60,18,60,38,61,28,62,38,60,52,60,66]],toe:1,cat:"legs",c:1.5},
{id:"marche-basse",n:"Montées sur marche basse",g:"legs",m:"Cuisses, fessiers",l:1,r:"8 à 12 par jambe",
 s:["Place-toi face à une marche basse et stable.","Pose un pied dessus et monte en poussant.","Redescends avec contrôle, puis change de jambe."],
 e:["Pousser avec la jambe arrière.","Marche glissante."],f:"Choisis une marche plus basse.",
 k:[[66,12,66,22,68,42,66,32,66,42,80,48,78,60,62,58,56,72],[78,6,78,16,78,36,78,26,78,36,78,48,78,60,86,44,84,56]],pr:STEP,cat:"legs",c:0.4,side:1},
{id:"squat-bulgare",n:"Squat bulgare",g:"legs",m:"Cuisses, fessiers, équilibre",l:3,r:"6 à 10 par jambe",
 s:["Pose le pied arrière sur une chaise stable.","Descends en pliant la jambe avant.","Remonte en poussant sur le talon avant."],
 e:["Pied avant trop près de la chaise.","Buste trop penché."],f:"Pied arrière au sol : fente arrière.",
 k:[[52,10,52,20,52,40,54,30,52,40,62,56,66,72,42,56,30,52],[54,22,54,32,52,52,56,42,54,52,66,58,66,72,44,62,30,52]],pr:chair(18,34,52),cat:"legs",c:0.3,side:1},
{id:"squat-saute",n:"Squat sauté",g:"legs",m:"Cuisses, fessiers, explosivité",l:3,r:"6 à 10 répétitions",
 s:["Descends en squat contrôlé.","Pousse fort pour sauter.","Réceptionne en douceur, genoux souples."],
 e:["Réception raide.","Genoux qui rentrent."],f:"Squat suivi d’une montée sur pointes.",
 k:[SQUAT_B,[60,4,60,14,60,34,62,16,62,6,60,50,60,64]],cat:"legs",c:0.3},
{id:"pont-unijambiste",n:"Pont à une jambe",g:"legs",m:"Fessiers, arrière des cuisses",l:3,r:"6 à 10 par jambe",
 s:["Comme le pont fessier, une jambe tendue en l’air.","Monte le bassin avec la jambe d’appui.","Redescends sans poser le bassin."],
 e:["Bassin qui tourne.","Dos creusé."],f:"Pont à deux jambes.",
 k:[[18,66,28,68,50,68,40,69,52,69,64,56,72,70,62,54,76,44],[18,66,28,68,52,54,40,69,52,69,68,52,72,70,64,42,78,34]],cat:"legs",c:0.4,side:1},
{id:"planche",n:"Planche classique",g:"abs",m:"Abdominaux, tronc",l:2,r:"20 à 45 secondes",
 s:["Prends appui sur les avant-bras et les pieds.","Garde le corps aligné, ventre serré.","Respire normalement pendant la tenue."],
 e:["Bassin qui s’affaisse.","Retenir sa respiration."],f:"Planche sur les genoux.",
 k:[[92,48,84,50,56,59,84,66,98,69,40,64.5,24,70],[92,47,84,49,56,57,84,66,98,69,40,63.5,24,70]],cat:"abs",c:3,u:"s"},
{id:"planche-genoux",n:"Planche sur les genoux",g:"abs",m:"Abdominaux, stabilité",l:1,r:"20 à 40 secondes",
 s:["Même position que la planche, genoux au sol.","Aligne les genoux, les hanches et la tête.","Tiens en respirant calmement."],
 e:["Fesses en l’air.","Épaules qui s’affaissent."],f:"Planche contre un support surélevé.",
 k:[[92,48,84,50,66,58,84,66,98,69,46,70,34,60],[92,47,84,49,66,56,84,66,98,69,46,70,34,60]],cat:"abs",c:3,u:"s"},
{id:"dead-bug",n:"Dead bug",g:"abs",m:"Abdominaux profonds, coordination",l:1,r:"8 par côté",
 s:["Allonge-toi sur le dos, bras vers le plafond et genoux levés.","Tends lentement un bras et la jambe opposée.","Reviens au centre et alterne."],
 e:["Bas du dos qui se décolle du sol.","Mouvement trop rapide."],f:"Bouge seulement les jambes.",
 k:[[16,66,28,68,54,68,28,59,28,50,54,52,70,52,58,52,74,52],[16,66,28,68,54,68,20,64,10,66,54,52,70,52,70,64,86,68]],cat:"abs",c:0.5,side:1},
{id:"crunch-inverse",n:"Crunch inversé",g:"abs",m:"Abdominaux",l:2,r:"8 à 15 répétitions",
 s:["Allonge-toi sur le dos, genoux pliés.","Ramène doucement les genoux vers la poitrine en décollant légèrement le bassin.","Reviens sans élan."],
 e:["Balancer les jambes.","Tirer sur la nuque."],f:"Ramène seulement un genou à la fois.",
 k:[[14,66,26,68,54,68,26,68,38,69,64,54,78,62],[14,66,26,68,52,62,26,68,38,69,42,52,56,46]],cat:"abs",c:0.5},
{id:"crunch-velo",n:"Crunch vélo",g:"abs",m:"Abdominaux, obliques",l:2,r:"20 alternances",
 s:["Sur le dos, mains légères derrière la tête.","Rapproche un coude du genou opposé en tournant le buste.","Alterne en gardant un rythme lent."],
 e:["Tirer sur la nuque.","Coudes qui se ferment."],f:"Crunch classique.",
 k:[[20,58,30,63,54,68,32,52,22,56,70,60,86,66,62,54,74,60],[20,58,30,63,54,68,40,56,22,56,62,54,74,60,70,60,86,66]],cat:"abs",c:1},
{id:"mountain-climbers",n:"Mountain climbers",g:"abs",m:"Abdominaux, épaules, cardio",l:2,r:"20 à 30 alternances",
 s:["Position de pompe, mains sous les épaules.","Ramène un genou vers la poitrine.","Alterne les jambes, d’abord lentement."],
 e:["Fesses en l’air.","Épaules qui reculent."],f:"Mains sur une chaise stable.",
 k:[[96,45,88,48,58,58,88,59,88,70,40,64,24,70,72,62,62,70],[96,45,88,48,58,58,88,59,88,70,72,62,62,70,40,64,24,70]],cat:"abs",c:1.5},
{id:"crunch",n:"Crunch classique",g:"abs",m:"Abdominaux",l:1,r:"10 à 20 répétitions",
 s:["Sur le dos, genoux pliés, mains légères derrière la tête.","Décolle les épaules du sol en expirant.","Redescends lentement."],
 e:["Tirer sur la nuque.","Monter trop haut avec le dos."],f:"Mains croisées sur la poitrine, petite amplitude.",
 k:[[20,66,30,68,54,68,24,64,22,66,66,56,74,70],[30,54,36,60,54,68,32,48,26,52,66,56,74,70]],cat:"abs",c:0.5},
{id:"releves-jambes",n:"Relevés de jambes",g:"abs",m:"Bas des abdominaux",l:2,r:"8 à 12 répétitions",
 s:["Sur le dos, mains le long du corps, jambes tendues.","Lève les jambes à la verticale.","Redescends lentement sans cambrer."],
 e:["Dos creusé.","Descente en chute libre."],f:"Genoux pliés.",
 k:[[14,66,26,68,54,68,26,68,38,69,70,68,86,68],[14,66,26,68,54,68,26,68,38,69,54,52,54,36]],cat:"abs",c:0.4},
{id:"planche-laterale",n:"Planche latérale",g:"abs",m:"Obliques, tronc",l:2,r:"15 à 30 s par côté",
 s:["Allongé sur le côté, appui sur l’avant-bras sous l’épaule.","Lève les hanches pour aligner le corps.","Tiens la position, puis change de côté."],
 e:["Hanches qui s’affaissent.","Coude loin de l’épaule."],f:"Genou du dessous plié au sol.",
 k:[[88,44,80,50,48,66,80,70,92,70,34,68,18,70],[88,40,80,46,48,57,80,70,92,70,34,63,18,70]],cat:"abs",c:2,u:"s",side:1},
{id:"toucher-epaule",n:"Planche avec toucher d’épaule",g:"abs",m:"Abdominaux, épaules, stabilité",l:2,r:"20 touchers",
 s:["Position de pompe, pieds un peu écartés.","Touche une épaule avec la main opposée.","Repose la main et alterne."],
 e:["Bassin qui se balance.","Mouvements trop vifs."],f:"Pieds plus écartés, ou genoux au sol.",
 k:[[96,45,88,48,58,58,88,59,88,70,40,64,24,70],[96,45,88,48,58,58,100,58,92,50,40,64,24,70]],cat:"abs",c:1},
{id:"curl-sac",n:"Flexions des biceps avec sac",g:"arm",m:"Biceps",l:1,r:"10 à 15 répétitions",
 s:["Tiens le sac par une poignée solide, coudes près du corps.","Plie les bras pour le remonter.","Redescends lentement."],
 e:["Balancer le dos.","Coudes qui avancent."],f:"Bouteille d’eau à la place du sac.",
 k:[[60,14,60,24,60,44,62,34,63,45,60,58,60,72],[60,14,60,24,60,44,62,34,69,26,60,58,60,72]],bag:"w",cat:"arm",c:0.8},
{id:"curl-serviette",n:"Curl serviette",g:"arm",m:"Biceps, avant-bras",l:1,r:"10 à 12 répétitions",
 s:["Passe une serviette sous un pied, tiens les deux bouts.","Plie les bras en tirant, le pied résiste.","Relâche lentement."],
 e:["Épaules qui montent.","Serviette qui glisse sans contrôle."],f:"Résistance plus légère du pied.",
 k:[[60,14,60,24,60,44,62,34,63,45,60,58,60,72],[60,14,60,24,60,44,62,34,68,28,60,58,60,72]],cat:"arm",c:0.6},
{id:"curl-concentre",n:"Curl concentré assis",g:"arm",m:"Biceps",l:1,r:"10 à 12 par bras",
 s:["Assis sur une chaise, coude contre l’intérieur de la cuisse.","Remonte le sac vers l’épaule.","Redescends sans lâcher la tension."],
 e:["Coude qui décolle.","Dos rond."],f:"Bouteille d’eau à la place du sac.",
 k:[[66,28,60,38,48,56,62,52,66,64,66,56,66,72],[66,28,60,38,48,56,62,52,72,42,66,56,66,72]],pr:chair(32,54,56),bag:"w",cat:"arm",c:0.6,side:1},
{id:"flexion-poignets",n:"Flexions des poignets",g:"arm",m:"Avant-bras",l:1,r:"10 à 15 répétitions",
 s:["Assis, pose l’avant-bras sur la cuisse, paume vers le haut, bouteille légère en main.","Plie doucement le poignet vers le haut.","Redescends lentement."],
 e:["Avant-bras qui décolle.","Bouteille trop lourde."],f:"Sans poids.",
 k:[[52,26,50,36,48,56,54,46,70,52,66,56,66,72,78,60],[52,26,50,36,48,56,54,46,70,52,66,56,66,72,78,44]],bag:"t",cat:"arm",c:0.5},
{id:"extension-poignets",n:"Extensions des poignets",g:"arm",m:"Avant-bras (face supérieure)",l:1,r:"10 à 15 répétitions",
 s:["Assis, avant-bras sur la cuisse, paume vers le bas, bouteille légère en main.","Lève doucement le dos de la main.","Redescends lentement."],
 e:["Mouvement trop rapide.","Coude qui bouge."],f:"Sans poids.",
 k:[[52,26,50,36,48,56,54,46,70,52,66,56,66,72,78,56],[52,26,50,36,48,56,54,46,70,52,66,56,66,72,77,42]],bag:"t",cat:"arm",c:0.5},
{id:"marche-fermier",n:"Marche du fermier",g:"arm",m:"Avant-bras, poigne, trapèzes",l:1,r:"20 à 40 secondes",
 s:["Tiens un sac ou une bouteille pleine dans chaque main.","Marche lentement, épaules basses, dos droit.","Fais demi-tour et repars."],
 e:["Épaules qui montent.","Charge trop lourde pour la poigne."],f:"Charges plus légères.",
 k:[[60,14,60,24,60,44,61,34,62,44,56,58,52,72,64,58,68,72],[60,14,60,24,60,44,61,34,62,44,64,58,68,72,56,58,52,72]],bag:"w",cat:"arm",c:3,u:"s"},
{id:"serrage-serviette",n:"Serrage de serviette",g:"arm",m:"Poigne, avant-bras, mains",l:1,r:"5 à 8 serrages de 5 s",
 s:["Tiens une serviette roulée dans la main.","Serre fermement quelques secondes sans douleur.","Relâche complètement."],
 e:["Serrer jusqu’à la douleur.","Retenir sa respiration."],f:"Serrage plus léger.",
 k:[[60,14,60,24,60,44,64,34,70,34,60,58,60,72],[60,14,60,24,60,44,64,34,71,33,60,58,60,72]],bag:"w",cat:"arm",c:1.5,u:"s"},
{id:"jumping-jacks",n:"Jumping jacks",g:"cardio",m:"Jambes, épaules, endurance",l:1,r:"20 à 40 répétitions",
 s:["Debout, pieds joints, bras le long du corps.","Saute en écartant les pieds et en levant les bras.","Reviens à la position de départ."],
 e:["Réception sur les talons.","Mouvement saccadé."],f:"Version sans saut : un pied après l’autre.",
 k:[[60,14,60,24,60,44,61,34,62,44,60,58,60,72,60,58,60,72],[60,14,60,24,60,44,63,12,62,2,52,58,46,72,68,58,74,72]]},
{id:"montees-genoux",n:"Montées de genoux",g:"cardio",m:"Jambes, hanches, cardio",l:1,r:"20 à 30 secondes",
 s:["Debout, bras pliés.","Marche ou cours sur place en levant les genoux.","Commence sans saut."],
 e:["Buste qui se penche en arrière.","Respiration bloquée."],f:"Marche sur place.",
 k:[[60,14,60,24,60,44,64,34,70,30,60,58,60,72,60,58,60,72],[60,14,60,24,60,44,56,34,62,28,74,46,72,60,60,58,60,72]]},
{id:"burpees",n:"Burpees adaptés",g:"cardio",m:"Corps entier, endurance",l:3,r:"5 à 10 répétitions",
 s:["Plie les genoux et pose les mains au sol.","Recule les pieds un par un en position de planche.","Reviens debout. Le saut est facultatif."],
 e:["Dos creusé en planche.","Aller trop vite."],f:"Sans pompe et sans saut.",
 k:[STAND,[68,52,60,50,44,60,70,60,76,70,64,62,50,72],PLANK]},
{id:"squat-pointes",n:"Squat suivi d’une montée sur pointes",g:"cardio",m:"Cuisses, fessiers, mollets",l:2,r:"10 à 15 répétitions",
 s:["Réalise un squat contrôlé.","En te redressant, monte sur la pointe des pieds.","Repose les talons."],
 e:["Talons qui décollent dans le squat.","Chevilles instables."],f:"Squat simple.",
 k:[SQUAT_A,SQUAT_B,[60,8,60,18,60,38,66,20,76,20,60,52,60,66]],toe:1},
{id:"boxe",n:"Boxe dans le vide",g:"cardio",m:"Épaules, bras, cardio",l:1,r:"30 à 60 secondes",
 s:["Jambes légèrement fléchies, poings devant le visage.","Lance un poing tendu, rotation du buste.","Reviens en garde et alterne."],
 e:["Bras qui se verrouillent.","Garde qui tombe."],f:"Rythme lent.",
 k:[[60,14,60,24,60,44,63,33,68,24,58,58,56,72,66,58,72,72],[60,14,60,24,60,44,72,28,84,26,58,58,56,72,66,58,72,72]]},
{id:"rotations-epaules",n:"Rotations des épaules",g:"mob",m:"Épaules, haut du dos",l:1,r:"10 cercles de chaque sens",
 s:["Debout, bras relâchés.","Fais des cercles lents avec les épaules vers l’avant.","Inverse le sens."],
 e:["Cercles trop petits.","Nuque tendue."],f:"Un côté à la fois.",
 k:[[60,14,60,24,60,44,54,32,54,42,60,58,60,72],[60,14,60,24,60,44,60,28,60,38,60,58,60,72],[60,14,60,24,60,44,66,32,66,42,60,58,60,72]]},
{id:"chat-vache",n:"Chat-vache",g:"mob",m:"Colonne vertébrale, dos",l:1,r:"8 à 10 cycles",
 s:["À quatre pattes, mains sous les épaules.","Arrondis le dos en expirant.","Creuse très légèrement en inspirant."],
 e:["Forcer l’amplitude.","Respiration bloquée."],f:"Amplitude réduite.",
 k:[[84,62,78,56,50,48,79,63,80,70,50,70,34,70],[88,46,78,52,50,60,79,62,80,70,50,70,34,70]]},
{id:"mobilite-chevilles",n:"Mobilité des chevilles",g:"mob",m:"Chevilles",l:1,r:"10 cercles par cheville",
 s:["Tiens-toi à un support, un pied légèrement levé.","Fais des cercles lents avec la cheville.","Change de sens, puis de pied."],
 e:["Cercles trop rapides.","Genou qui bouge."],f:"Assis, jambe tendue.",
 k:[[60,14,60,24,60,44,61,34,62,44,60,58,60,72,66,56,60,66],[60,14,60,24,60,44,61,34,62,44,60,58,60,72,66,56,66,70],[60,14,60,24,60,44,61,34,62,44,60,58,60,72,66,56,72,66],[60,14,60,24,60,44,61,34,62,44,60,58,60,72,66,56,66,62]]},
{id:"etirement-mollets",n:"Étirement des mollets",g:"mob",m:"Mollets",l:1,r:"20 à 30 s par jambe",
 s:["Mains contre un mur, recule une jambe.","Garde le talon arrière au sol, jambe tendue.","Fléchis la jambe avant jusqu’à sentir l’étirement."],
 e:["Talon qui décolle.","Dos creusé."],f:"Rapproche le pied arrière.",
 k:[[90,22,84,28,70,46,92,31,100,34,80,58,82,72,60,58,50,72],[94,25,88,30,74,46,94,33,100,34,84,58,86,72,62,60,48,72]],pr:wall(103),side:1},
{id:"etirement-cuisses",n:"Étirement doux des cuisses",g:"mob",m:"Avant des cuisses",l:1,r:"20 à 30 s par jambe",
 s:["Tiens-toi à un support stable.","Plie un genou et rapproche doucement le talon de la fesse.","Garde les genoux proches l’un de l’autre."],
 e:["Dos creusé.","Tirer fort sur le pied."],f:"Garde le pied plus bas.",
 k:[[60,14,60,24,60,44,61,34,62,44,60,58,60,72,60,58,60,72],[60,14,60,24,60,44,54,38,48,50,60,58,60,72,60,60,47,51]],side:1}
];
var BY={};E.forEach(function(x){BY[x.id]=x;});

var COMBOS=[
["Éveil","pompes-classiques","crunch","squats","dips-chaise","flexion-poignets"],
["Forge","pompes-inclinees","planche","fentes","extension-sac","serrage-serviette"],
["Pulsar","pompes-genoux","crunch-velo","squat-saute","kickback","curl-sac"],
["Ancrage","pompes-prise","dead-bug","chaise-mur","sphinx","marche-fermier"],
["Éclair","pompes-declinees","mountain-climbers","pont-fessier","dips-chaise","extension-poignets"],
["Sillage","pompes-genoux","crunch-inverse","marche-basse","extension-sac","curl-serviette"],
["Basalte","pompes-classiques","planche-laterale","squat-bulgare","sphinx","flexion-poignets"],
["Orbite","pompes-pike","releves-jambes","pont-unijambiste","kickback","curl-concentre"],
["Tempête","pompes-inclinees","toucher-epaule","squats","dips-chaise","marche-fermier"],
["Zénith","pompes-declinees","mountain-climbers","squat-saute","dips-chaise","curl-sac"],
["Brume","pompes-prise","planche-genoux","fentes","extension-sac","serrage-serviette"],
["Apex","pompes-classiques","dead-bug","squat-bulgare","dips-chaise","extension-poignets"]
];
var CATS=["push","abs","legs","tri","arm"];

/* ---------- animation ---------- */
var SEG=1100, figs=[], reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function poseAt(ex,t){
  var K=ex.k,n=K.length,cyc=(n-1)*2,pos=(t/SEG)%cyc;
  if(pos>n-1)pos=cyc-pos;
  var i=Math.min(Math.floor(pos),n-2),f=pos-i;
  f=(1-Math.cos(Math.PI*f))/2;
  var a=K[i],b=K[i+1],o=new Array(a.length);
  for(var j=0;j<a.length;j++)o[j]=a[j]+(b[j]-a[j])*f;
  return o;
}
function pts(){var s=[];for(var i=0;i<arguments.length;i++)s.push(arguments[i]);return s.join(" ");}
function draw(F,p){
  var L=p.length,far=L>=18,tip=L===16?14:(L===20?18:-1);
  F.leg.setAttribute("points",pts(p[4]+","+p[5],p[10]+","+p[11],p[12]+","+p[13]));
  F.arm.setAttribute("points",pts(p[2]+","+p[3],p[6]+","+p[7],p[8]+","+p[9]));
  F.tor.setAttribute("points",pts(p[2]+","+p[3],p[4]+","+p[5]));
  F.head.setAttribute("cx",p[0]);F.head.setAttribute("cy",p[1]);
  if(far)F.far.setAttribute("points",pts(p[4]+","+p[5],p[14]+","+p[15],p[16]+","+p[17]));
  if(tip>=0)F.tip.setAttribute("points",pts(p[8]+","+p[9],p[tip]+","+p[tip+1]));
  if(F.bag){var bx=F.ex.bag==="t"?p[tip]:p[8],by=F.ex.bag==="t"?p[tip+1]:p[9];F.bag.setAttribute("x",bx-3.5);F.bag.setAttribute("y",by-4);}
  if(F.toe)F.toe.setAttribute("points",pts(p[12]+","+p[13],(p[12]+7)+",72"));
}
function makeFig(ex){
  var svg=document.createElementNS(NS,"svg");
  svg.setAttribute("viewBox","0 0 120 80");
  svg.setAttribute("role","img");
  svg.setAttribute("aria-label","Animation de l’exercice : "+ex.n);
  var far=ex.k[0].length>=18, tip=ex.k[0].length===16||ex.k[0].length===20;
  svg.innerHTML='<g class="pr"><path d="M4 72H116"/>'+(ex.pr||"")+'</g>'+
    (far?'<polyline class="far"/>':'')+'<polyline class="tor"/><polyline class="leg"/>'+
    (ex.toe?'<polyline class="toe"/>':'')+'<polyline class="arm"/>'+(tip?'<polyline class="tip"/>':'')+
    '<circle class="head" r="5.5"/>'+(ex.bag?'<rect class="bag" width="7" height="9" rx="1.5"/>':'');
  var F={ex:ex,svg:svg,vis:true,
    far:svg.querySelector(".far"),tor:svg.querySelector(".tor"),leg:svg.querySelector(".leg"),arm:svg.querySelector(".arm"),
    tip:svg.querySelector(".tip"),head:svg.querySelector(".head"),bag:svg.querySelector(".bag"),toe:svg.querySelector(".toe")};
  draw(F,poseAt(ex,0));
  figs.push(F);
  if(io)io.observe(svg);
  svg.__F=F;
  return svg;
}
var io=("IntersectionObserver" in window)?new IntersectionObserver(function(es){es.forEach(function(e){e.target.__F.vis=e.isIntersecting;});}):null;
if(io)io.observe;
function loop(t){
  for(var i=0;i<figs.length;i++){var F=figs[i];if(F.vis&&F.svg.isConnected)draw(F,poseAt(F.ex,t));}
  requestAnimationFrame(loop);
}
if(!reduce)requestAnimationFrame(loop);
function dropFigs(root){figs=figs.filter(function(F){var keep=!root.contains(F.svg);if(!keep&&io)io.unobserve(F.svg);return keep;});}

/* ---------- state ---------- */
var P=10;
try{var sv=parseInt(localStorage.getItem("nvb-max"),10);if(sv>0&&sv<=100)P=sv;}catch(e){}
function amount(ex,p){
  var n=p*ex.c;
  if(ex.u==="s"){n=Math.max(10,Math.round(n/5)*5);return n+" s"+(ex.side?" / côté":"");}
  n=Math.max(1,Math.round(n));return "× "+n+(ex.side?" / côté":"");
}
function dots(l){var s='<span class="dots" aria-label="'+LEVEL[l]+'">';for(var i=1;i<=3;i++)s+='<i class="'+(i<=l?"on":"")+'"></i>';return s+'</span>';}
function rarity(ids){
  var s=0;ids.forEach(function(id){s+=BY[id].l;});
  return s<=7?["commune","Commune"]:s<=9?["rare","Rare"]:s===10?["epique","Épique"]:["legendaire","Légendaire"];
}

/* ---------- combos ---------- */
function renderRatios(){
  var items=[["push","Pompes",1],["abs","Abdos",0.5],["legs","Squats",0.5],["tri","Dips chaise",2],["arm","Avant-bras",0.5]];
  document.getElementById("ratios").innerHTML=items.map(function(i){
    var n=Math.max(1,Math.round(P*i[2]));return '<li><b>'+n+'</b><span>'+i[1]+'</span></li>';}).join("");
}
function renderCards(){
  var root=document.getElementById("cards");dropFigs(root);root.innerHTML="";
  COMBOS.forEach(function(c,ci){
    var ids=c.slice(1),r=rarity(ids);
    var card=document.createElement("article");card.className="card r-"+r[0];card.id="carte-"+(ci+1);
    var head=document.createElement("div");head.className="card-head";
    head.innerHTML='<div><div class="num">Carte '+String(ci+1).padStart(2,"0")+" / "+COMBOS.length+'</div><h3>'+c[0]+'</h3></div><div class="rar">'+r[1]+'</div>';
    card.appendChild(head);
    var ul=document.createElement("ul");ul.className="rows";
    ids.forEach(function(id,k){
      var ex=BY[id],li=document.createElement("li"),b=document.createElement("button");
      b.type="button";b.className="row";b.setAttribute("data-id",id);
      b.appendChild(makeFig(ex));
      var mid=document.createElement("span");mid.innerHTML='<span class="c">'+CATLABEL[CATS[k]]+'</span><span class="t">'+ex.n+'</span>';
      var q=document.createElement("span");q.className="q";q.textContent=amount(ex,P);
      b.appendChild(mid);b.appendChild(q);li.appendChild(b);ul.appendChild(li);
    });
    card.appendChild(ul);
    var foot=document.createElement("div");foot.className="card-foot";foot.textContent="1 tour · 60 s de repos entre les exercices · stoppe si une douleur apparaît";
    card.appendChild(foot);root.appendChild(card);
  });
}
function setMax(v){
  v=Math.max(1,Math.min(100,Math.round(v)||1));P=v;
  document.getElementById("max").value=v;
  try{localStorage.setItem("nvb-max",String(v));}catch(e){}
  renderRatios();
  document.querySelectorAll("#cards .row").forEach(function(b){b.querySelector(".q").textContent=amount(BY[b.getAttribute("data-id")],P);});
}

/* ---------- library ---------- */
var filter="all",shuffled=E.slice(),query="";
function seeded(arr,seed){var a=arr.slice(),s=seed;for(var i=a.length-1;i>0;i--){s=(s*1103515245+12345)&0x7fffffff;var j=s%(i+1),t=a[i];a[i]=a[j];a[j]=t;}return a;}
shuffled=seeded(E,22);
function renderFilters(){
  var el=document.getElementById("filters"),h='<button type="button" class="chip" aria-pressed="'+(filter==="all")+'" data-f="all">Tous</button>';
  Object.keys(GROUPS).forEach(function(g){h+='<button type="button" class="chip" aria-pressed="'+(filter===g)+'" data-f="'+g+'">'+GROUPS[g]+'</button>';});
  el.innerHTML=h;
}
function renderLib(){
  var root=document.getElementById("lib");dropFigs(root);root.innerHTML="";
  var list=shuffled.filter(function(x){return filter==="all"||x.g===filter;});
  document.getElementById("count").textContent="("+E.length+")";
  list.forEach(function(ex){
    var b=document.createElement("button");b.type="button";b.className="ex";b.setAttribute("data-id",ex.id);
    b.appendChild(makeFig(ex));
    var t=document.createElement("div");
    t.innerHTML='<span class="tag">'+GROUPS[ex.g]+'</span><h3>'+ex.n+'</h3><div class="m">'+ex.m+'</div>';
    var d=document.createElement("div");d.innerHTML=dots(ex.l)+' <span class="m">'+LEVEL[ex.l]+'</span>';
    b.appendChild(t);b.appendChild(d);root.appendChild(b);
  });
}

/* ---------- sheet ---------- */
var lastFocus=null;
function openSheet(id){
  var ex=BY[id],sh=document.getElementById("sheet"),bg=document.getElementById("bg");
  dropFigs(sh);lastFocus=document.activeElement;
  var rep=ex.cat?'<span>Pour ton maximum de '+P+' pompes : <b>'+amount(ex,P)+'</b></span>':'';
  sh.innerHTML='<button class="close" type="button" aria-label="Fermer">✕</button><div id="bigfig"></div>'+
   '<h2 id="sheet-title">'+ex.n+'</h2>'+
   '<div class="facts"><span><b>'+GROUPS[ex.g]+'</b></span><span>'+ex.m+'</span><span>'+dots(ex.l)+' '+LEVEL[ex.l]+'</span><span>Durée ou répétitions : <b>'+ex.r+'</b></span>'+rep+'</div>'+
   '<div class="cols"><div><h4>Exécution</h4><ol>'+ex.s.map(function(s){return "<li>"+s+"</li>";}).join("")+'</ol></div>'+
   '<div><h4>Erreurs à éviter</h4><ul>'+ex.e.map(function(s){return "<li>"+s+"</li>";}).join("")+'</ul></div></div>'+
   '<div class="easy"><b>Variante plus facile :</b> '+ex.f+'</div>'+(ex.warn?'<div class="warn">'+ex.warn+'</div>':'');
  var big=makeFig(ex);big.setAttribute("class","big");sh.querySelector("#bigfig").appendChild(big);
  bg.classList.add("open");bg.setAttribute("aria-hidden","false");
  sh.querySelector(".close").focus();
}
function closeSheet(){
  var bg=document.getElementById("bg");bg.classList.remove("open");bg.setAttribute("aria-hidden","true");
  dropFigs(document.getElementById("sheet"));if(lastFocus&&lastFocus.focus)lastFocus.focus();
}

/* ---------- events ---------- */
document.getElementById("minus").addEventListener("click",function(){setMax(P-1);});
document.getElementById("plus").addEventListener("click",function(){setMax(P+1);});
document.getElementById("max").addEventListener("input",function(e){var v=parseInt(e.target.value,10);if(v>0)setMax(v);});
document.getElementById("max").addEventListener("change",function(e){setMax(parseInt(e.target.value,10));});
document.getElementById("draw").addEventListener("click",function(){
  var i=Math.floor(Math.random()*COMBOS.length),el=document.getElementById("carte-"+(i+1));
  document.querySelectorAll(".card.flash").forEach(function(c){c.classList.remove("flash");});
  void el.offsetWidth;el.classList.add("flash");
  el.scrollIntoView({behavior:reduce?"auto":"smooth",block:"center"});
});
document.getElementById("filters").addEventListener("click",function(e){var b=e.target.closest(".chip");if(!b)return;filter=b.getAttribute("data-f");renderFilters();renderLib();});
document.getElementById("shuffle").addEventListener("click",function(){shuffled=seeded(E,Math.floor(Math.random()*1e6)+1);renderLib();});
document.addEventListener("click",function(e){
  var b=e.target.closest(".row,.ex");if(b&&b.getAttribute("data-id")){openSheet(b.getAttribute("data-id"));return;}
  if(e.target.id==="bg"||e.target.closest(".close"))closeSheet();
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&document.getElementById("bg").classList.contains("open"))closeSheet();});
function tab(which){
  var c=which==="cartes";
  document.getElementById("view-cartes").hidden=!c;document.getElementById("view-biblio").hidden=c;
  document.getElementById("tab-cartes").setAttribute("aria-selected",c);document.getElementById("tab-biblio").setAttribute("aria-selected",!c);
}
document.getElementById("tab-cartes").addEventListener("click",function(){tab("cartes");});
document.getElementById("tab-biblio").addEventListener("click",function(){tab("biblio");});

document.getElementById("max").value=P;
renderRatios();renderCards();renderFilters();renderLib();
})();
