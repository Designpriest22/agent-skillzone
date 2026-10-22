/**
 * Image manifest. Every photo here is real MEAT & GREET photography.
 *
 * Sources
 *  - photos/*      → "Previous edition" galleries, deck p.10–11 (extracted
 *                    from the PDF at native resolution), the audience photo
 *                    from deck p.4, and three MEAT & GREET photos already
 *                    published on thecapitalmovement.com.
 *  - food/*        → Food photography from the deck's slide backgrounds
 *                    (p.2, p.3). Licence status unknown — see README.
 *  - brand/*       → Supplied SEASON FEST artwork, TCM and The Clique logos
 *                    (deck p.12), MEAT & GREET logo cut from deck p.1.
 */
import type { ImageMetadata } from 'astro';

import seasonFestLogo from '../assets/brand/season-fest-logo.webp';
import meatAndGreetLogo from '../assets/brand/meat-and-greet-logo.png';
import tcmLogo from '../assets/brand/tcm-logo.png';
import cliqueLogo from '../assets/brand/the-clique-logo.png';

import steaksFalling from '../assets/food/steaks-falling.jpg';
import grillCloseup from '../assets/food/grill-closeup.jpg';

import roastOnTheSpit from '../assets/photos/roast-on-the-spit.jpg';
import carvingTheRoast from '../assets/photos/carving-the-roast.jpg';
import crowdGreenSmoke from '../assets/photos/crowd-green-smoke.jpg';
import friendsUnderLights from '../assets/photos/friends-under-lights.jpg';
import friendsSeatedSelfie from '../assets/photos/friends-seated-selfie.jpg';
import drinksBar from '../assets/photos/drinks-bar.jpg';
import crowdConversation from '../assets/photos/crowd-conversation.jpg';
import photoWall from '../assets/photos/photo-wall.jpg';
import gardenGuests from '../assets/photos/garden-guests.jpg';
import crowdStageTruss from '../assets/photos/crowd-stage-truss.jpg';
import guestsPeaceSign from '../assets/photos/guests-peace-sign.jpg';
import guestsWithCups from '../assets/photos/guests-with-cups.jpg';
import handsOnTheMeat from '../assets/photos/hands-on-the-meat.jpg';
import crowdJoy from '../assets/photos/crowd-joy.jpg';
import handsUpNight from '../assets/photos/hands-up-night.jpg';
import servingTheGrill from '../assets/photos/serving-the-grill.jpg';
import danceCheer from '../assets/photos/dance-cheer.jpg';
import crowdPhonesUp from '../assets/photos/crowd-phones-up.jpg';
import fieldWideNight from '../assets/photos/field-wide-night.jpg';
import crowdNightDance from '../assets/photos/crowd-night-dance.jpg';
import audienceFeature from '../assets/photos/audience-feature.jpg';
import guestWarmLight from '../assets/photos/guest-warm-light.jpg';
import wrapFirstBite from '../assets/photos/wrap-first-bite.jpg';
import danceBlueLight from '../assets/photos/dance-blue-light.jpg';

export interface Photo {
  src: ImageMetadata;
  alt: string;
}

const p = (src: ImageMetadata, alt: string): Photo => ({ src, alt });

export const BRAND = {
  seasonFest: p(seasonFestLogo, 'SEASON FEST'),
  meatAndGreet: p(meatAndGreetLogo, 'MEAT & GREET'),
  tcm: p(tcmLogo, 'The Capital Movement (TCM)'),
  clique: p(cliqueLogo, 'The Clique'),
};

export const FOOD = {
  steaksFalling: p(steaksFalling, 'Grilled steaks tumbling with garlic, peppercorns and chilli over open flame'),
  grillCloseup: p(grillCloseup, 'Sausage, steak and tomato searing on a charcoal grill'),
};

export const PHOTOS = {
  roastOnTheSpit: p(roastOnTheSpit, 'A whole roast turning on a spit as guests gather behind it at night'),
  carvingTheRoast: p(carvingTheRoast, 'The grill crew carving a whole roast in front of a painted wall'),
  crowdGreenSmoke: p(crowdGreenSmoke, 'A packed crowd under green lights and drifting smoke'),
  friendsUnderLights: p(friendsUnderLights, 'Guests laughing together under the trees and green lights'),
  friendsSeatedSelfie: p(friendsSeatedSelfie, 'Friends sitting together on the lawn, taking a selfie'),
  drinksBar: p(drinksBar, 'A drinks bar with bottles lined up and a bartender pouring'),
  crowdConversation: p(crowdConversation, 'Guests deep in conversation in a busy crowd'),
  photoWall: p(photoWall, 'Three guests posing in front of a bright swirling mural'),
  gardenGuests: p(gardenGuests, 'Guests mingling in a garden lit green'),
  crowdStageTruss: p(crowdStageTruss, 'A crowd on the lawn beside the stage lighting truss'),
  guestsPeaceSign: p(guestsPeaceSign, 'A guest flashing a peace sign beside friends'),
  guestsWithCups: p(guestsWithCups, 'Guests with drinks talking under green lights'),
  handsOnTheMeat: p(handsOnTheMeat, 'Guests reaching in to share grilled meat from a table'),
  crowdJoy: p(crowdJoy, 'A guest mid-laugh, dancing in the night crowd'),
  handsUpNight: p(handsUpNight, 'A guest throwing a hand in the air in front of the crowd'),
  servingTheGrill: p(servingTheGrill, 'Guests passing plates of grilled meat across the table'),
  danceCheer: p(danceCheer, 'Guests cheering with their arms in the air'),
  crowdPhonesUp: p(crowdPhonesUp, 'A guest dancing in the middle of the crowd as others film'),
  fieldWideNight: p(fieldWideNight, 'A wide view of the crowd on an open field at night'),
  crowdNightDance: p(crowdNightDance, 'Guests dancing close together under the night sky'),
  audienceFeature: p(audienceFeature, 'A guest beaming in the middle of a lively night crowd at MEAT & GREET'),
  guestWarmLight: p(guestWarmLight, 'A smiling guest in warm golden light'),
  wrapFirstBite: p(wrapFirstBite, 'A guest taking the first bite of a foil-wrapped wrap'),
  danceBlueLight: p(danceBlueLight, 'Friends dancing under blue stage light'),
};

/** Two scroll-linked rows for the atmosphere gallery. */
export const GALLERY_ROWS: Photo[][] = [
  [
    PHOTOS.crowdGreenSmoke,
    PHOTOS.photoWall,
    PHOTOS.handsUpNight,
    PHOTOS.friendsSeatedSelfie,
    PHOTOS.carvingTheRoast,
    PHOTOS.crowdNightDance,
    PHOTOS.drinksBar,
    PHOTOS.danceCheer,
    PHOTOS.gardenGuests,
  ],
  [
    PHOTOS.fieldWideNight,
    PHOTOS.crowdJoy,
    PHOTOS.servingTheGrill,
    PHOTOS.guestsPeaceSign,
    PHOTOS.crowdStageTruss,
    PHOTOS.crowdConversation,
    PHOTOS.crowdPhonesUp,
    PHOTOS.guestsWithCups,
    PHOTOS.friendsUnderLights,
  ],
];
