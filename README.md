# Coplano

Coplano est une ébauche d'assistant de plan de circulation. En cliquant sur les flèches, on fait apparaitre (ou disparaitre) des rat runs. Cela marche uniquement sur desktop. L'idée est de facilement dessiner les plans de circulation, de visualiser les rat runs, et peut-être à terme de générer semi-automatiquement une partie des plans.

Voilà un exemple de plan de circu pour le quartier Boinod/Simplon dans le 18ème arrondissement de Paris :
- ![bleu](assets/blue.jpg) Axes actuels
- ![vert](assets/green.jpg) Axes modifiés
- ![rouge](assets/red.jpg) Rat runs

![Quartier Boinod : les flèches vertes représentent les axes modifiés, les bleus les axes actuels. Il n'y a plus de rat runs](assets/Boinod_500px.png)

## Comment utiliser Coplano ?

Il y a trois phases :
1. **Une phase d'initialisation :** création d'un geojson pour décrire un quartier sur [cocarto.com](cocarto.com)
2. **Une phase de configuration :** correction de noeuds et définition des transits
3. **Une phase d'analyse :** ouvrir le plan dans Coplano et analyser les plans de circulation possibles

## Phase I - Initialisation

Le fichier geojson décrit les carrefours (noeuds) et les sens de circulation du quartier, simples ou doubles. Le geojson doit contenir un nuage de points et ceux-ci doivent être annotés via les propriétés ci-dessous. Pour le créer, on recommande d'utiliser [cocarto.com](https://cocarto.com/).

Un exemple est visible ici : https://cocarto.com/fr/share/TGeknxKpH8CPTvu2

![Site cocarto: configuration du quartier Marx Dormoy à Paris 18](assets/cocarto-marx-dormoy.jpg)


### Etapes

1. Créer une nouvelle couche dans [cocarto.com](https://cocarto.com/)
2. Ajouter les 7 colonnes listées ci-dessous
3. Créer chacun des points ou "noeuds" (5-10 min)
4. Remplir les 7 colonnes (30-45 min)
5. Exporter le fichier geojson et l'importer dans Coplano


### Configuration : colonnes à ajouter

Type nombre entier:
- `id`
- `osm_id`

Type booléen:
- `transit_node`

Type texte:
- `local_street`
- `local_street_double_way`
- `local_street_modal_filter`
- `transit_whitelist`
- `transit_street` _(optionnel)_
- `transit_blacklist` _(optionnel)_

*Notes :*
- les colonnes de type texte doivent toutes suivre le même format "21,25,26" c'est-à-dire une suite d'entiers séparés par des virgules.
- contrairement à la capture d'écran, tous les noms de colonnes doivent être définis en minuscule


## Phase II - Configuration des noeuds

### Annotation des colonnes

Chaque noeud est identifié au moyen d'un identifiant `id`, un nombre entier qui doit être unique (1, 2, 3, etc). L'`id` servira ensuite à définir les sens de circulation et les axes de transits.

`local_street`, `local_street_double_way` et `local_street_modal_filter` permettent de définir les sens de circulation dans les segments de rue locaux :
- `local_street` : segment à sens de circulation unique
- `local_street_double_way` : à double-sens
- `local_street_modal_filter` : aucun sens de circulation

`transit_node` est utilisé pour définir un noeud de transit.

`transit_whitelist`, `transit_blacklist` et `transit_street` permettent de raffiner les axes de transits et les transits pertinents.

### Comment définir les transits pertinents ?

Par défaut, l'algorithme cherche **tous les chemins possibles pour relier un noeud de transit à un autre noeud de transit par des segments de rue locaux**.

On peut affiner cette recherche par trois moyens :
- `transit_whitelist` : on définit explicitement vers quel noeud de "destination" l'algorithme cherchera à relier le noeud origine. C'est l'option la plus simple. A noter, la valeur "0" est une exception et désactive toute recherche.
- `transit_blacklist` : il peut paraître peu pertinent de relier tel noeud de transit à tel noeud de transit. On peut alors définir des exceptions. Si 1 et 14 sont des noeuds de transit mais qu'on considère que les relier n'est pas pertinent et encombrerait la représentation du plan, on peut ajouter la valeur "14" dans _transit_exceptions_ à la ligne où _id_ vaut 1. L'algorithme ignorera les rat runs démarrant de 1 et aboutissant à 14.
- `transit_street` : si des noeuds de transit sont des noeuds successifs d'un même boulevard, on peut considérer inutile de vouloir montrer un rat run de l'un de ces noeuds à l'autre. On peut alors relier ces noeuds entre eux par _transit_street_. Ces noeuds feront alors partie d'un même "axe de transit" ou _transit set_, et l'algorithme ne cherchera pas à relier 2 noeuds du même axe de transit. L'algorithme cherchera par contre à relier des axes de transit différents entre eux, de tel sorte qu'il passe par des noeuds locaux.

### Erreurs au chargement

Une relation entre un noeud A et un noeud B ne peut être définie qu'une et une seule fois. Une erreur est générée si A référence B et B référence A.

En cas d'erreur, une exception s'affiche (dans la console, F12) et le chargement est interrompu.

![exceptions](assets/exceptions.png)

## Phase III - Analyse

En cliquant sur un segment, la _flèche_ itère entre ces états :
- sens de circulation 
- sens de circulation inverse
- sens de circulation double
- aucun sens de circulation

L'état initial défini dans le geojson est en ![bleu](assets/blue.jpg), les autres états en ![vert](assets/green.jpg). En ![rouge](assets/red.jpg) s'affichent les rat runs.

# Comment contribuer au projet ?

## Ajouter un plan ou une version d'un plan

A venir

## Contribuer au code

Il y a beaucoup à faire et les contributions sont bienvenues. Pour lancer le code en local, on peut par exemple utiliser la commande ci-dessous puis aller sur http://localhost:8000/ :

`python -m http.server`

Pour faire tourner les tests, on lance :

`npm test`

Cela donnera un résultat tel que ci-dessous :

![test_results](assets/test_results.jpg)

A noter qu'il est nécessaire d'installer Node JS pour lancer les tests. Voir https://nodejs.org/.