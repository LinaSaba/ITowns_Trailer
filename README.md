# ITowns_Train


L'objectif de ce projet est de visualiser la trajectoire d'une boule à l'île de la Réunion. 

Pour lancer le projet, il faut commencer par :

```git clone https://github.com/LinaSaba/ITowns_Train.git```

Ensuite, on utilise MAMP pour visualiser le projet (pour le télécharger :https://www.mamp.info/en/downloads/) sinon sur un environnement 
similaire.

Ensuite, on déplace le dossier dans C:\MAMP\tdocs (à l'endroit où MAMP va pouvoir lire le fichier en localhost par défaut en général)

Une fois, cela est réussi on peut ouvrir le projet sur cet URL : http://localhost:8888/ITowns_Train/



Les difficultés rencontrées sont liées au SRC, en effet on a eu du mal à afficher la trace GPX dans le bon système de coordonnées à cause du Scene Graph comme les coordonnées des points du tracé étaient dans le système de coordonnées de notre mesh. 
En fin de compte, nous avons utilisé les coordonnées géographiques que nous avons transformé dans le SCR : 2975. 
Le mouvement de la boule était variant du à la distance entre les points des tracés, ainsi pour résoudre cette difficulté nous avons régulé la vitesse de la boule pour que la boule ait un mouvement constant.

Nous voulions aussi intégré des données liés au cours d'eau pour ainsi visulisé le cours d'eau le plus proche à chaque instant, sauf que par défaut de données nous n'avons pas trouvé un mesh de couche des données de la BDTopo mais plutôt une couche en 2D. Une fois ces données intégrées, les cours d'eau se situaient à l'altitude 0.


