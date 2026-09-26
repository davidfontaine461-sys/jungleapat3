# {{ site.name }}
> Jardin botanique tropical à {{ address.locality }}, dans le sud de l'île de La Réunion. Une sortie nature en famille : promenade sur des sentiers tropicaux, carnet pédagogique pour les enfants, coin marmaille et coin café.

## Informations pratiques
- Adresse : {{ address.street }}, {{ address.postalCode }} {{ address.locality }}, {{ address.region }}
- Horaires : {{ hours.summary }}
- Tarifs : {{ prices.summary }}
- Téléphone : {{ contact.phoneE164 }}
- Réservation : inutile pour les visites individuelles et familiales ; obligatoire à partir de {{ groups.minSize }} personnes (écoles, groupes)

## Ce qu'on peut y faire
- Parcours en cinq étapes à travers une végétation tropicale (plantes exotiques et locales) sur un terrain d'environ {{ visit.areaHectares }} hectare
- Carnet pédagogique ludique pour les enfants : observation, dessin, petits jeux
- Coin café : citronnade, gaufres, glaces et douceurs maison
- Coin marmaille pour les plus petits
- Sorties scolaires et accueil de groupes / centres de loisirs : {{ groups.days }}, jusqu'à {{ groups.maxPupils }} élèves, sur une journée ({{ groups.endTimeNote }}), {{ groups.pupilPrice }} {{ groups.pupilPriceCondition }}, une place d'accompagnant offerte pour {{ groups.freeAdultPerPupils }} élèves ; pas de visite guidée par un guide, la visite est guidée par les carnets pédagogiques (partagés par équipes de 2 ou 3 élèves)
- Durée moyenne de visite : {{ visit.duration }}
- Sanitaires : toilettes classiques et urinoir extérieur
- Pique-nique autorisé sur place ; chiens acceptés en laisse
- Accessibilité : sentiers parfois étroits et rocailleux, non adaptés aux fauteuils roulants ni aux poussettes

## Pages
- [Accueil]({{ site.baseUrl }}/) : présentation du jardin, parcours, horaires, tarifs, plan et FAQ
- [Le jardin botanique]({{ site.baseUrl }}/jardin-botanique-reunion/) : plantes, histoire du lieu, déroulé de la visite, préparer sa venue
- [Écoles et groupes]({{ site.baseUrl }}/ecoles-groupes/) : sorties scolaires, centres de loisirs et groupes à partir de {{ groups.minSize }} personnes

## À propos
Jardin créé à partir de {{ visit.foundedYear }} par {{ visit.founder }} sur un terrain d'environ {{ visit.areaHectares }} hectare, aujourd'hui tenu en famille par {{ visit.team }}. Une sortie nature dans le sud de La Réunion, à proximité de Saint-Pierre et de Saint-Louis.

## Contact
- Email : {{ contact.email }}
- Google Maps : {{{ address.mapsPlaceUrl }}}
- Instagram : {{{ social.instagram }}}
