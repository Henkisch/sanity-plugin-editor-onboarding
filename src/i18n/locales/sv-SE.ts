import {type OnboardingResourceKey} from './en-US'

/**
 * Swedish.
 *
 * Terminology follows Sanity's own `@sanity/locale-sv-se` bundle so the guides
 * use the same words the surrounding Studio does: "utkast" for draft,
 * "publicera"/"publicerad" for publish/published, and "release" left in English
 * exactly as Sanity leaves it.
 */
const svSE: Record<OnboardingResourceKey, string> = {
  // — Tour chrome —
  'action.next': 'Nästa',
  'action.done': 'Klar',
  'action.skip': 'Hoppa över',
  'action.close': 'Stäng',
  'action.dont-show-again': 'Visa inte det här igen',
  'action.learn-more': 'Läs mer',
  'action.source': 'Källa: Sanitys dokumentation',
  'progress': '{{current}} / {{total}}',

  // — Guides menu —
  // — Hjälp på fältnivå —
  'field.help': 'Vad är det här fältet?',

  'menu.title': 'Redaktionella guider',
  'menu.button-label': 'Redaktionella guider',
  'menu.show-all-again': 'Visa alla guider igen',
  'menu.status.completed': 'Genomförd',
  'menu.status.dismissed': 'Dold',
  'menu.unavailable':
    'Den här guiden pekar på delar av Studio som inte är öppna just nu. Öppna ett dokument och försök igen.',

  // — Core concepts: essentials —
  'tour.essentials.title': 'Kom igång med Sanity Studio',
  'tour.essentials.description': 'Utkast, publicerat innehåll och hur du hittar runt',
  'tour.essentials.intro.title': 'Hitta runt i Sanity Studio',
  'tour.essentials.intro.content':
    'Fyra snabba steg, och du kan avsluta när du vill. Allt ligger kvar under bok-ikonen ' +
    'uppe i menyraden.',
  'tour.essentials.drafts.title': 'Utkast och publicerat innehåll',
  'tour.essentials.drafts.content':
    'Varje dokument har ett utkast som du redigerar och en publicerad version som din webbplats läser. Här växlar du hela Studio mellan de två, så att du ser exakt vad som är live.',
  'tour.essentials.new.title': 'Skapa något nytt',
  'tour.essentials.new.content':
    'Skapa ett dokument av vilken typ som helst härifrån, var du än befinner dig i Studio.',
  'tour.essentials.search.title': 'Hitta vad som helst',
  'tour.essentials.search.content':
    'Sök i alla dokumenttyper samtidigt — användbart när du minns rubriken men inte var den ligger.',
  'tour.essentials.guides.title': 'Fler guider finns här',
  'tour.essentials.guides.content':
    'Korta guider om publicering, kommentarer och uppgifter, releaser och bilder finns i den här menyn. Öppna den när du vill — även för att köra den här guiden igen.',

  // — Core concepts: publishing —
  'tour.publishing.title': 'Redigera och publicera',
  'tour.publishing.description': 'Vad som händer med dina ändringar, och hur du ångrar dem',
  'tour.publishing.unavailable':
    'Den här guiden pekar på dokumentredigeraren. Öppna ett dokument och starta den igen.',
  'tour.publishing.autosave.title': 'Dina ändringar är redan sparade',
  'tour.publishing.autosave.content':
    'Ändringar sparas medan du skriver — det finns ingen spara-knapp. Här växlar du mellan utkastet du arbetar med och den version som är publicerad just nu.',
  'tour.publishing.slug.title': 'Sluggen är sidans adress',
  'tour.publishing.slug.content':
    'En slug är sista delen av en webbadress — allt som kommer efter ditt domännamn. Den ' +
    'skapas oftast från titeln, så du behöver sällan skriva den själv. Ändrar du den senare ' +
    'ändras länken, och allt som redan pekar på den gamla adressen slutar fungera.',
  'tour.publishing.publish.title': 'Publicering gör innehållet live',
  'tour.publishing.publish.content':
    'Dina ändringar stannar i utkastet tills du publicerar. När du publicerar ersätter utkastet den publicerade version som din webbplats läser.',
  'tour.publishing.history.title': 'Alla ändringar sparas',
  'tour.publishing.history.content':
    'Den här menyn innehåller dokumentets historik. Jämför en tidigare version sida vid sida med den nuvarande och återställ den om något blev fel.',

  // — Core concepts: collaboration —
  'tour.collaboration.title': 'Arbeta tillsammans',
  'tour.collaboration.description': 'Närvaro, kommentarer och uppgifter',
  'tour.collaboration.presence.title': 'Du redigerar inte ensam',
  'tour.collaboration.presence.content':
    'När en kollega öppnar samma dokument visas deras avatar här, och deras markör syns i fältet de arbetar i. Era ändringar slås ihop medan ni skriver.',
  'tour.collaboration.tasks.title': 'Här samlas det som ska göras',
  'tour.collaboration.tasks.content':
    'Uppgifter visar vad som tilldelats dig och vad som återstår. Kommentarer fungerar ' +
    'likadant — lämna en på vilket fält som helst och nämn en kollega, så stannar den kvar ' +
    'vid innehållet i stället för att försvinna i en chatt.',

  // — Core concepts: releases —
  'tour.releases.title': 'Schemalägg med releaser',
  'tour.releases.description': 'Publicera flera dokument tillsammans, vid en vald tidpunkt',
  'tour.releases.bundle.title': 'Samla ändringar i en release',
  'tour.releases.bundle.content':
    'En release grupperar dokument som ska gå live tillsammans — en kampanj, en produktlansering — så att de publiceras på en gång i stället för ett i taget.',
  'tour.releases.preview.title': 'Förhandsgranska en release innan den går live',
  'tour.releases.preview.content':
    'Växla Studio till en release för att se webbplatsen exakt som den kommer att se ut när releasen är publicerad.',

  // — Core concepts: media —
  'tour.media.title': 'Bilder och filer',
  'tour.media.description': 'Hur filer lagras och återanvänds',
  'tour.media.unavailable':
    'Den här guiden pekar på ett bildfält. Öppna ett dokument som har ett och försök igen.',
  'tour.media.assets.title': 'Ladda upp en gång, använd överallt',
  'tour.media.assets.content':
    'Bilder och filer ligger i ett gemensamt bibliotek i stället för inuti dokumentet du laddade upp dem i, så att samma fil kan återanvändas på hela webbplatsen utan en extra kopia.',

  // — Konventionssökaren (verktyg för utvecklare) —
  'conventions.heading': 'Konventioner',
  'conventions.intro':
    'Hittar mönster som redaktörerna redan följer i publicerat innehåll och gör de du väljer till fältguider. Inget når redaktörerna förrän du klistrar in koden i din config.',
  'conventions.type-label': 'Dokumenttyp',
  'conventions.run': 'Hitta konventioner',
  'conventions.running': 'Letar efter mönster…',
  'conventions.cost':
    'Skickar upp till {{limit}} publicerade dokument, förkortade, till Sanitys AI. Ett anrop, som dras från projektets AI-krediter.',
  // i18next picks the form from `count`.
  'conventions.too-few_one':
    'Den här typen har {{count}} publicerat dokument. Det behövs minst {{min}} innan något kan räknas som ett mönster.',
  'conventions.too-few_other':
    'Den här typen har {{count}} publicerade dokument. Det behövs minst {{min}} innan något kan räknas som ett mönster.',
  'conventions.none':
    'Inga konventioner hittades. Det är ett giltigt svar: inget här följer ett mönster som fältbeskrivningarna inte redan nämner.',
  'conventions.evidence': 'Finns i {{count}} av {{total}}',
  'conventions.select-hint':
    'Kryssa i de som är värda att visa redaktörerna och kopiera dem som kod.',
  'conventions.copy': 'Kopiera som fieldGuides-kod',
  'conventions.copied': 'Kopierat. Klistra in i fieldGuides-listan i sanity.config.ts.',
  'conventions.error.ai-disabled':
    'AI-funktioner är avstängda för organisationen. En ägare kan slå på dem på sanity.io/manage.',
  'conventions.error.quota': 'Projektet har slut på AI-krediter eller har nått sin AI-budget.',
  'conventions.error.session': 'Sessionen har gått ut. Ladda om Studion och logga in igen.',
  'conventions.error.unknown': 'Anropet misslyckades. Detaljer finns i webbläsarens konsol.',
}

export default svSE
