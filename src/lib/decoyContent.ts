/**
 * Believable, mundane fake chat content for seeding the DECOY account (see decoySeed.ts). Purely
 * innocuous everyday small talk, localized so the decoy matches the app language. NOTHING here is
 * secret or sensitive - it is cover material a coercer is meant to browse and find boring. Each
 * language holds a large pool (~100 conversations); each arming draws a random 7-15 of them. A
 * missing language falls back to en (decoySeed.ts). Generated content; edit via that flow, not by hand.
 */
export interface DecoyMessageSeed {
  mine: boolean;
  text: string;
}
export interface DecoyContactSeed {
  name: string;
  messages: DecoyMessageSeed[];
}

export const DECOY_CONTENT: Record<string, DecoyContactSeed[]> = {
  "de": [
    {
      "name": "Mama",
      "messages": [
        {
          "mine": false,
          "text": "schatz kommst du sonntag zum mittagessen? gibts rouladen"
        },
        {
          "mine": true,
          "text": "ja gerne! soll ich was mitbringen?"
        },
        {
          "mine": false,
          "text": "nö nur dich und hunger haha"
        },
        {
          "mine": true,
          "text": "hunger hab ich immer bei dir 😄 um wieviel uhr?"
        },
        {
          "mine": false,
          "text": "so gegen 12 halb 1"
        },
        {
          "mine": true,
          "text": "passt, bis sonntag mama"
        }
      ]
    },
    {
      "name": "Papa",
      "messages": [
        {
          "mine": true,
          "text": "papa läuft dein auto noch komisch?"
        },
        {
          "mine": false,
          "text": "ne war beim meier, kupplung war lose. jetzt gut"
        },
        {
          "mine": true,
          "text": "achso zum glück"
        },
        {
          "mine": false,
          "text": "hat trotzdem 180 gekostet mann mann"
        },
        {
          "mine": true,
          "text": "autsch. hauptsache es fährt wieder"
        }
      ]
    },
    {
      "name": "Oma",
      "messages": [
        {
          "mine": false,
          "text": "kind kannst du mir den fernseher zeigen wenn du da bist? geht wieder nicht an"
        },
        {
          "mine": true,
          "text": "klar oma, hast du auf den grünen knopf gedrückt?"
        },
        {
          "mine": false,
          "text": "welcher grüne knopf"
        },
        {
          "mine": true,
          "text": "ich komm einfach vorbei am donnerstag ok?"
        },
        {
          "mine": false,
          "text": "ja bring dir kuchen mit ♥"
        },
        {
          "mine": true,
          "text": "immer gern haha bis donnerstag"
        }
      ]
    },
    {
      "name": "Opa",
      "messages": [
        {
          "mine": true,
          "text": "opa wie war das mit dem rasenmäher? springt nicht an"
        },
        {
          "mine": false,
          "text": "sprit alt? tank mal frisch nach"
        },
        {
          "mine": true,
          "text": "hab ich, kommt nix"
        },
        {
          "mine": false,
          "text": "dann is die zündkerze hin. komm morgen vorbei ich hab noch eine"
        },
        {
          "mine": true,
          "text": "top danke opa"
        }
      ]
    },
    {
      "name": "Lena",
      "messages": [
        {
          "mine": false,
          "text": "hey wollen wir samstag kaffee trinken gehen?"
        },
        {
          "mine": true,
          "text": "jaa unbedingt, hab dich ewig nicht gesehen"
        },
        {
          "mine": false,
          "text": "das neue cafe am markt soll gut sein"
        },
        {
          "mine": true,
          "text": "hab ich auch gehört. 15 uhr?"
        },
        {
          "mine": false,
          "text": "perfekt, freu mich"
        },
        {
          "mine": true,
          "text": "ich mich auch ♥"
        }
      ]
    },
    {
      "name": "Tobi",
      "messages": [
        {
          "mine": true,
          "text": "alter kommst du heute zum kicken?"
        },
        {
          "mine": false,
          "text": "boah weiß nicht, rücken zwickt"
        },
        {
          "mine": true,
          "text": "komm schon wir sind nur zu fünft sonst"
        },
        {
          "mine": false,
          "text": "ok überredet, 18 uhr platz?"
        },
        {
          "mine": true,
          "text": "jap bis dann"
        }
      ]
    },
    {
      "name": "Sarah",
      "messages": [
        {
          "mine": false,
          "text": "kannst du mir dein waffeleisen leihen? back sonntag für die kinder"
        },
        {
          "mine": true,
          "text": "klar hol ich dir raus, wann brauchst du es?"
        },
        {
          "mine": false,
          "text": "würds samstag abholen wenn das geht"
        },
        {
          "mine": true,
          "text": "passt, klingel einfach"
        },
        {
          "mine": false,
          "text": "super danke dir!!"
        }
      ]
    },
    {
      "name": "Michi",
      "messages": [
        {
          "mine": true,
          "text": "hast du die bohrmaschine noch von mir?"
        },
        {
          "mine": false,
          "text": "oh stimmt ja sorry, bring ich morgen vorbei"
        },
        {
          "mine": true,
          "text": "kein stress, brauch sie erst nächste woche"
        },
        {
          "mine": false,
          "text": "dann leg ich sie dir in den flur wenn ich vorbeikomm"
        },
        {
          "mine": true,
          "text": "top"
        }
      ]
    },
    {
      "name": "Julia",
      "messages": [
        {
          "mine": false,
          "text": "was kochst du heute? mir fällt nix ein"
        },
        {
          "mine": true,
          "text": "wollt nudeln mit pesto machen, easy"
        },
        {
          "mine": false,
          "text": "oh gute idee, hab noch pesto im kühlschrank"
        },
        {
          "mine": true,
          "text": "dazu bissl parmesan und fertig"
        },
        {
          "mine": false,
          "text": "danke für die rettung haha"
        }
      ]
    },
    {
      "name": "Kevin",
      "messages": [
        {
          "mine": true,
          "text": "hey bist du am wochenende in der stadt?"
        },
        {
          "mine": false,
          "text": "jo warum?"
        },
        {
          "mine": true,
          "text": "wollt fragen ob du mir beim umzugskarton tragen hilfst"
        },
        {
          "mine": false,
          "text": "klar, sonntag hab ich zeit"
        },
        {
          "mine": true,
          "text": "mega danke, gibt pizza danach"
        },
        {
          "mine": false,
          "text": "sold haha"
        }
      ]
    },
    {
      "name": "Handwerker Meier",
      "messages": [
        {
          "mine": false,
          "text": "guten tag, wegen dem tropfenden wasserhahn: passt ihnen donnerstag 9 uhr?"
        },
        {
          "mine": true,
          "text": "ja donnerstag 9 uhr geht gut, danke"
        },
        {
          "mine": false,
          "text": "prima, ich bring die neue dichtung gleich mit"
        },
        {
          "mine": true,
          "text": "super, bis donnerstag"
        }
      ]
    },
    {
      "name": "Frau Schmidt",
      "messages": [
        {
          "mine": false,
          "text": "hallo, ihr paket wurde bei mir abgegeben, können sie es holen?"
        },
        {
          "mine": true,
          "text": "oh danke! komm gleich rüber, passt es jetzt?"
        },
        {
          "mine": false,
          "text": "ja bin daheim, klingeln sie einfach"
        },
        {
          "mine": true,
          "text": "bin in 5 minuten da"
        }
      ]
    },
    {
      "name": "Nachbar Klaus",
      "messages": [
        {
          "mine": true,
          "text": "hallo klaus, wir grillen samstag im hof, kommen sie dazu?"
        },
        {
          "mine": false,
          "text": "gerne! soll ich was mitbringen?"
        },
        {
          "mine": true,
          "text": "vielleicht nen salat, getränke haben wir genug"
        },
        {
          "mine": false,
          "text": "mach ich, so ab wann?"
        },
        {
          "mine": true,
          "text": "ab 17 uhr, freuen uns"
        }
      ]
    },
    {
      "name": "Anna",
      "messages": [
        {
          "mine": false,
          "text": "gehst du morgen auch zum wochenmarkt?"
        },
        {
          "mine": true,
          "text": "wollte eigentlich, brauch erdbeeren"
        },
        {
          "mine": false,
          "text": "dann könnten wir zusammen, ich fahr um 9"
        },
        {
          "mine": true,
          "text": "gut nimmst du mich mit? spar ich sprit"
        },
        {
          "mine": false,
          "text": "klar hol dich ab"
        },
        {
          "mine": true,
          "text": "danke ♥"
        }
      ]
    },
    {
      "name": "Basti",
      "messages": [
        {
          "mine": true,
          "text": "wie war dein urlaub?"
        },
        {
          "mine": false,
          "text": "mega erholsam, nur regen die letzten 2 tage"
        },
        {
          "mine": true,
          "text": "typisch haha wo wart ihr nochmal?"
        },
        {
          "mine": false,
          "text": "an der ostsee, ferienwohnung"
        },
        {
          "mine": true,
          "text": "klingt gut, will auch mal wieder weg"
        }
      ]
    },
    {
      "name": "Chef",
      "messages": [
        {
          "mine": false,
          "text": "können sie morgen eine stunde früher anfangen? lieferung kommt um 7"
        },
        {
          "mine": true,
          "text": "ja das geht klar, bin um 7 da"
        },
        {
          "mine": false,
          "text": "super danke, ich schreib es ins schichtbuch"
        },
        {
          "mine": true,
          "text": "alles gut, bis morgen"
        }
      ]
    },
    {
      "name": "Frau Weber Kita",
      "messages": [
        {
          "mine": false,
          "text": "guten morgen, lisa hat ihre trinkflasche vergessen, sie steht bei uns"
        },
        {
          "mine": true,
          "text": "ach danke, hol ich beim abholen mit"
        },
        {
          "mine": false,
          "text": "genau, sie hatte heute viel spaß beim malen"
        },
        {
          "mine": true,
          "text": "schön zu hören, bis nachmittag"
        }
      ]
    },
    {
      "name": "Praxis Dr Braun",
      "messages": [
        {
          "mine": true,
          "text": "guten tag, ich brauche einen termin zur vorsorge"
        },
        {
          "mine": false,
          "text": "gerne, wie wäre der 12. um 10:30 uhr?"
        },
        {
          "mine": true,
          "text": "passt, den nehm ich"
        },
        {
          "mine": false,
          "text": "notiert, bitte versichertenkarte mitbringen"
        },
        {
          "mine": true,
          "text": "mach ich, danke"
        }
      ]
    },
    {
      "name": "Zahnarzt",
      "messages": [
        {
          "mine": false,
          "text": "erinnerung: ihr kontrolltermin ist morgen um 14 uhr"
        },
        {
          "mine": true,
          "text": "oh danke fürs erinnern, kann ich auf 15 uhr schieben?"
        },
        {
          "mine": false,
          "text": "ja 15 uhr ist auch frei, kein problem"
        },
        {
          "mine": true,
          "text": "super, dann bis morgen um 15"
        },
        {
          "mine": false,
          "text": "prima, bis morgen"
        }
      ]
    },
    {
      "name": "Friseur Sonja",
      "messages": [
        {
          "mine": true,
          "text": "hi sonja, hättest du diese woche noch einen termin frei?"
        },
        {
          "mine": false,
          "text": "freitag 16 uhr wär noch was, nur schneiden?"
        },
        {
          "mine": true,
          "text": "ja nur schneiden, freitag passt"
        },
        {
          "mine": false,
          "text": "trag ich ein, bis freitag :)"
        }
      ]
    },
    {
      "name": "Werkstatt",
      "messages": [
        {
          "mine": false,
          "text": "ihr wagen ist fertig, tüv ist durch"
        },
        {
          "mine": true,
          "text": "super, was bin ich schuldig?"
        },
        {
          "mine": false,
          "text": "142 euro mit ölwechsel"
        },
        {
          "mine": true,
          "text": "ok komm heute nachmittag vorbei"
        },
        {
          "mine": false,
          "text": "alles klar, bis dann"
        }
      ]
    },
    {
      "name": "Paketshop",
      "messages": [
        {
          "mine": false,
          "text": "eine sendung liegt für sie abholbereit"
        },
        {
          "mine": true,
          "text": "danke, bis wann habt ihr heute auf?"
        },
        {
          "mine": false,
          "text": "bis 18 uhr durchgehend"
        },
        {
          "mine": true,
          "text": "komm nach der arbeit vorbei"
        }
      ]
    },
    {
      "name": "Tante Ute",
      "messages": [
        {
          "mine": false,
          "text": "wollte nur hören wie es euch geht, lang nix gehört"
        },
        {
          "mine": true,
          "text": "uns gehts gut, viel um die ohren mit den kindern"
        },
        {
          "mine": false,
          "text": "das kenn ich noch haha, kommt ihr im sommer mal?"
        },
        {
          "mine": true,
          "text": "gerne, wir schauen mal nach nem wochenende"
        },
        {
          "mine": false,
          "text": "freu mich schon, drück euch"
        }
      ]
    },
    {
      "name": "Onkel Werner",
      "messages": [
        {
          "mine": true,
          "text": "onkel werner, brauchst du sonntag hilfe im garten?"
        },
        {
          "mine": false,
          "text": "oh das wär lieb, die hecke muss dringend geschnitten werden"
        },
        {
          "mine": true,
          "text": "komm um 10 mit der heckenschere"
        },
        {
          "mine": false,
          "text": "super, gibt danach kaffee und kuchen"
        },
        {
          "mine": true,
          "text": "na dann erst recht haha"
        }
      ]
    },
    {
      "name": "Cousine Nina",
      "messages": [
        {
          "mine": false,
          "text": "hast du das rezept von omas kartoffelsalat?"
        },
        {
          "mine": true,
          "text": "klar, kartoffeln, gurke, zwiebel, senf, essig, öl, brühe"
        },
        {
          "mine": false,
          "text": "mayo oder ohne?"
        },
        {
          "mine": true,
          "text": "oma macht ohne, nur brühe"
        },
        {
          "mine": false,
          "text": "perfekt danke, will es zum geburtstag machen"
        }
      ]
    },
    {
      "name": "Schwester",
      "messages": [
        {
          "mine": true,
          "text": "holst du mama sonntag ab oder ich?"
        },
        {
          "mine": false,
          "text": "mach du, ich hab das auto in der werkstatt"
        },
        {
          "mine": true,
          "text": "ok kein problem, um 11 bei ihr?"
        },
        {
          "mine": false,
          "text": "ja passt, dann sind wir alle da"
        },
        {
          "mine": true,
          "text": "gut bis sonntag"
        }
      ]
    },
    {
      "name": "Bruder",
      "messages": [
        {
          "mine": false,
          "text": "kannst du mir 20 euro leihen? hab meinen geldbeutel vergessen"
        },
        {
          "mine": true,
          "text": "klar, überweis ich dir gleich"
        },
        {
          "mine": false,
          "text": "danke bro, geb ich freitag zurück"
        },
        {
          "mine": true,
          "text": "kein stress"
        }
      ]
    },
    {
      "name": "Steffi",
      "messages": [
        {
          "mine": false,
          "text": "wollen wir nächste woche mal wieder joggen?"
        },
        {
          "mine": true,
          "text": "au ja, dienstag oder donnerstag?"
        },
        {
          "mine": false,
          "text": "donnerstag früh vor der arbeit?"
        },
        {
          "mine": true,
          "text": "6:30 an der brücke?"
        },
        {
          "mine": false,
          "text": "bin dabei, hoffentlich regnets nicht"
        },
        {
          "mine": true,
          "text": "sonst gehen wir halt kaffee trinken haha"
        }
      ]
    },
    {
      "name": "Markus",
      "messages": [
        {
          "mine": true,
          "text": "hey funktioniert dein drucker wieder?"
        },
        {
          "mine": false,
          "text": "ja war nur die patrone leer"
        },
        {
          "mine": true,
          "text": "ah gut, wollt dich sonst fragen ob ich was drucken darf"
        },
        {
          "mine": false,
          "text": "klar komm vorbei, druck was du brauchst"
        },
        {
          "mine": true,
          "text": "danke dir"
        }
      ]
    },
    {
      "name": "Paul",
      "messages": [
        {
          "mine": false,
          "text": "spielst du samstag mit uns karten?"
        },
        {
          "mine": true,
          "text": "wer kommt denn alles?"
        },
        {
          "mine": false,
          "text": "ich, tim, die anna und du hoffentlich"
        },
        {
          "mine": true,
          "text": "na klar bin dabei, ab wann?"
        },
        {
          "mine": false,
          "text": "20 uhr bei mir, chips gibts"
        },
        {
          "mine": true,
          "text": "top bis samstag"
        }
      ]
    },
    {
      "name": "Laura",
      "messages": [
        {
          "mine": true,
          "text": "hast du zufällig noch eier? mir fehlen 2 fürs backen"
        },
        {
          "mine": false,
          "text": "ja hab genug, komm rüber"
        },
        {
          "mine": true,
          "text": "du rettest meinen kuchen haha danke"
        },
        {
          "mine": false,
          "text": "kein ding, dafür kriegst ein stück ab :)"
        },
        {
          "mine": true,
          "text": "abgemacht"
        }
      ]
    },
    {
      "name": "Tim",
      "messages": [
        {
          "mine": false,
          "text": "fährst du morgen zufällig richtung innenstadt?"
        },
        {
          "mine": true,
          "text": "ja um 8 zur arbeit, brauchst du mit?"
        },
        {
          "mine": false,
          "text": "wär super, mein bus fällt aus"
        },
        {
          "mine": true,
          "text": "hol dich um viertel vor 8 ab"
        },
        {
          "mine": false,
          "text": "danke dir, warte unten"
        }
      ]
    },
    {
      "name": "Vermieter",
      "messages": [
        {
          "mine": true,
          "text": "guten tag, die heizung im wohnzimmer wird nicht warm"
        },
        {
          "mine": false,
          "text": "danke für die info, ich schick den installateur diese woche"
        },
        {
          "mine": true,
          "text": "gut, wann passt es ihm ungefähr?"
        },
        {
          "mine": false,
          "text": "er meldet sich direkt bei ihnen für einen termin"
        },
        {
          "mine": true,
          "text": "alles klar, danke"
        }
      ]
    },
    {
      "name": "Hausmeister",
      "messages": [
        {
          "mine": false,
          "text": "das licht im treppenhaus ist wieder kaputt, ich tausch die birne morgen"
        },
        {
          "mine": true,
          "text": "oh super danke, war schon dunkel abends"
        },
        {
          "mine": false,
          "text": "kein problem, mach ich früh"
        },
        {
          "mine": true,
          "text": "und die mülltonne im hof ist übervoll, nur zur info"
        },
        {
          "mine": false,
          "text": "danke, ruf ich bei der abfuhr an"
        }
      ]
    },
    {
      "name": "Kollege Jonas",
      "messages": [
        {
          "mine": true,
          "text": "kannst du meine schicht am freitag tauschen? hab arzttermin"
        },
        {
          "mine": false,
          "text": "welche schicht denn?"
        },
        {
          "mine": true,
          "text": "die spätschicht, 14 bis 22"
        },
        {
          "mine": false,
          "text": "ok ich nehm sie, dafür machst du meine am montag?"
        },
        {
          "mine": true,
          "text": "deal, danke dir"
        }
      ]
    },
    {
      "name": "Kollegin Petra",
      "messages": [
        {
          "mine": false,
          "text": "kommst du mit zur mittagspause? kantine gibts heute schnitzel"
        },
        {
          "mine": true,
          "text": "oh ja, treffen um 12 am aufzug?"
        },
        {
          "mine": false,
          "text": "passt, ich reservier uns nen tisch"
        },
        {
          "mine": true,
          "text": "super, bis gleich"
        }
      ]
    },
    {
      "name": "Trainer Fußball",
      "messages": [
        {
          "mine": false,
          "text": "training morgen fällt aus, platz ist gesperrt wegen regen"
        },
        {
          "mine": true,
          "text": "schade, gibts ersatz?"
        },
        {
          "mine": false,
          "text": "wir machen donnerstag ne extra einheit"
        },
        {
          "mine": true,
          "text": "ok bin dabei, danke fürs bescheid geben"
        }
      ]
    },
    {
      "name": "Elternchat Mia",
      "messages": [
        {
          "mine": false,
          "text": "wer bringt am freitag den kuchen für den schulbasar mit?"
        },
        {
          "mine": true,
          "text": "ich kann einen marmorkuchen backen"
        },
        {
          "mine": false,
          "text": "super, dann fehlt nur noch obst"
        },
        {
          "mine": true,
          "text": "kann noch nen obstsalat machen wenns hilft"
        },
        {
          "mine": false,
          "text": "perfekt, du bist ein schatz"
        }
      ]
    },
    {
      "name": "Yoga Doreen",
      "messages": [
        {
          "mine": true,
          "text": "findet der kurs morgen abend statt?"
        },
        {
          "mine": false,
          "text": "ja um 19 uhr wie immer, bring deine matte mit"
        },
        {
          "mine": true,
          "text": "hab ich, freu mich schon"
        },
        {
          "mine": false,
          "text": "bis morgen dann :)"
        }
      ]
    },
    {
      "name": "Buchclub Karin",
      "messages": [
        {
          "mine": false,
          "text": "habt ihr das buch schon durch? treffen ist nächsten mittwoch"
        },
        {
          "mine": true,
          "text": "bin bei der hälfte, wird spannend"
        },
        {
          "mine": false,
          "text": "haha kein spoiler bitte"
        },
        {
          "mine": true,
          "text": "keine sorge, bis mittwoch"
        },
        {
          "mine": false,
          "text": "ich back plätzchen dazu"
        }
      ]
    },
    {
      "name": "Papa Fußball",
      "messages": [
        {
          "mine": true,
          "text": "wer fährt sonntag die jungs zum auswärtsspiel?"
        },
        {
          "mine": false,
          "text": "ich kann 4 mitnehmen im kombi"
        },
        {
          "mine": true,
          "text": "super, ich nehm die anderen 3"
        },
        {
          "mine": false,
          "text": "treffpunkt 8 uhr am vereinsheim?"
        },
        {
          "mine": true,
          "text": "passt, bis sonntag"
        }
      ]
    },
    {
      "name": "Nachbarin Gaby",
      "messages": [
        {
          "mine": false,
          "text": "gießt du in unserem urlaub die blumen? sind nur 5 tage"
        },
        {
          "mine": true,
          "text": "na klar, gib mir den schlüssel vorher"
        },
        {
          "mine": false,
          "text": "danke dir, bring ihn morgen rüber"
        },
        {
          "mine": true,
          "text": "kein problem, schöne ferien euch"
        },
        {
          "mine": false,
          "text": "♥ du bist die beste"
        }
      ]
    },
    {
      "name": "Sportverein",
      "messages": [
        {
          "mine": false,
          "text": "der mitgliedsbeitrag wird nächste woche abgebucht, nur zur info"
        },
        {
          "mine": true,
          "text": "danke, ist genug auf dem konto"
        },
        {
          "mine": false,
          "text": "super, sommerfest ist übrigens am 20."
        },
        {
          "mine": true,
          "text": "oh schön, kommen wir gerne"
        }
      ]
    },
    {
      "name": "Kita Gruppe",
      "messages": [
        {
          "mine": false,
          "text": "am mittwoch ist ausflug in den zoo, bitte festes schuhwerk"
        },
        {
          "mine": true,
          "text": "alles klar, brauchen die kinder ein vesper mit?"
        },
        {
          "mine": false,
          "text": "ja bitte und ne trinkflasche"
        },
        {
          "mine": true,
          "text": "mach ich, danke"
        }
      ]
    },
    {
      "name": "Postbote",
      "messages": [
        {
          "mine": false,
          "text": "ich hab ihr paket beim nachbarn abgegeben, keiner war da"
        },
        {
          "mine": true,
          "text": "kein problem, bei welchem nachbarn denn?"
        },
        {
          "mine": false,
          "text": "bei nummer 12, der ältere herr"
        },
        {
          "mine": true,
          "text": "ah gut, danke fürs bescheid geben"
        },
        {
          "mine": false,
          "text": "gern, schönen tag noch"
        }
      ]
    },
    {
      "name": "Physio",
      "messages": [
        {
          "mine": true,
          "text": "guten tag, kann ich meinen termin von montag auf mittwoch schieben?"
        },
        {
          "mine": false,
          "text": "mittwoch 11 uhr wäre frei, passt das?"
        },
        {
          "mine": true,
          "text": "ja super, danke"
        },
        {
          "mine": false,
          "text": "erledigt, bis mittwoch"
        }
      ]
    },
    {
      "name": "Tierarzt",
      "messages": [
        {
          "mine": false,
          "text": "erinnerung: bello ist nächste woche zur impfung dran"
        },
        {
          "mine": true,
          "text": "stimmt ja, welcher tag geht bei euch?"
        },
        {
          "mine": false,
          "text": "dienstag oder freitag vormittag"
        },
        {
          "mine": true,
          "text": "dann freitag 10 uhr bitte"
        },
        {
          "mine": false,
          "text": "notiert, bis freitag"
        }
      ]
    },
    {
      "name": "Hundesitter",
      "messages": [
        {
          "mine": true,
          "text": "hast du samstag zeit auf luna aufzupassen? wir sind auf ner feier"
        },
        {
          "mine": false,
          "text": "ja klar, wann bringt ihr sie?"
        },
        {
          "mine": true,
          "text": "so gegen 17 uhr, holen sie sonntag früh"
        },
        {
          "mine": false,
          "text": "passt, freu mich auf die kleine"
        },
        {
          "mine": true,
          "text": "danke dir, sie liebt dich haha"
        }
      ]
    },
    {
      "name": "Zoohandlung",
      "messages": [
        {
          "mine": true,
          "text": "habt ihr das katzenfutter von der marke wieder da?"
        },
        {
          "mine": false,
          "text": "ja seit gestern, in allen sorten"
        },
        {
          "mine": true,
          "text": "super, leg mir 3 dosen huhn zurück?"
        },
        {
          "mine": false,
          "text": "mach ich, holen sie es heute noch?"
        },
        {
          "mine": true,
          "text": "ja komm nach 16 uhr vorbei"
        }
      ]
    },
    {
      "name": "Blumenladen",
      "messages": [
        {
          "mine": true,
          "text": "kann ich einen strauß für morgen bestellen? geburtstag meiner mutter"
        },
        {
          "mine": false,
          "text": "gerne, welche farben mag sie?"
        },
        {
          "mine": true,
          "text": "rosa und weiß wär schön"
        },
        {
          "mine": false,
          "text": "machen wir hübsch, abholung um wieviel uhr?"
        },
        {
          "mine": true,
          "text": "so gegen 10, danke"
        }
      ]
    },
    {
      "name": "Bäcker",
      "messages": [
        {
          "mine": true,
          "text": "habt ihr am sonntag brötchen? und die laugenstangen?"
        },
        {
          "mine": false,
          "text": "ja bis 12 uhr geöffnet, laugenstangen auch"
        },
        {
          "mine": true,
          "text": "super, dann komm ich früh"
        },
        {
          "mine": false,
          "text": "bis sonntag :)"
        }
      ]
    },
    {
      "name": "Metzger",
      "messages": [
        {
          "mine": true,
          "text": "kann ich für samstag 1 kilo hackfleisch vorbestellen?"
        },
        {
          "mine": false,
          "text": "klar, halb und halb oder rind?"
        },
        {
          "mine": true,
          "text": "halb und halb bitte"
        },
        {
          "mine": false,
          "text": "leg ich zurück, holen sie es früh?"
        },
        {
          "mine": true,
          "text": "ja gleich morgens, danke"
        }
      ]
    },
    {
      "name": "Reinigung",
      "messages": [
        {
          "mine": false,
          "text": "ihr anzug ist fertig zur abholung"
        },
        {
          "mine": true,
          "text": "prima, wie lange habt ihr heute offen?"
        },
        {
          "mine": false,
          "text": "bis 18:30 uhr"
        },
        {
          "mine": true,
          "text": "komm nach feierabend, danke"
        }
      ]
    },
    {
      "name": "Optiker",
      "messages": [
        {
          "mine": false,
          "text": "ihre neue brille ist da, sie können sie anprobieren kommen"
        },
        {
          "mine": true,
          "text": "super, muss ich einen termin machen?"
        },
        {
          "mine": false,
          "text": "nein einfach vorbeikommen, wir passen sie an"
        },
        {
          "mine": true,
          "text": "top, komm morgen"
        }
      ]
    },
    {
      "name": "Apotheke",
      "messages": [
        {
          "mine": true,
          "text": "ist mein rezept schon fertig? die salbe war nicht vorrätig"
        },
        {
          "mine": false,
          "text": "ja seit heute morgen, sie können abholen"
        },
        {
          "mine": true,
          "text": "super, danke, komm mittags"
        },
        {
          "mine": false,
          "text": "bis später"
        }
      ]
    },
    {
      "name": "Fahrgemeinschaft",
      "messages": [
        {
          "mine": false,
          "text": "morgen fahr ich, hol ich dich um 7:15 ab?"
        },
        {
          "mine": true,
          "text": "ja passt, warte an der ecke"
        },
        {
          "mine": false,
          "text": "gut, und tankst du diese woche?"
        },
        {
          "mine": true,
          "text": "ja bin dran, mach ich heute abend"
        },
        {
          "mine": false,
          "text": "super, bis morgen"
        }
      ]
    },
    {
      "name": "Nils",
      "messages": [
        {
          "mine": true,
          "text": "hast du das spiel gestern gesehen?"
        },
        {
          "mine": false,
          "text": "ja mann, unglaublich in der nachspielzeit noch"
        },
        {
          "mine": true,
          "text": "hab fast den fernseher umgeworfen haha"
        },
        {
          "mine": false,
          "text": "next time schauen wir zusammen"
        },
        {
          "mine": true,
          "text": "bringst du chips mit"
        },
        {
          "mine": false,
          "text": "logo"
        }
      ]
    },
    {
      "name": "Jana",
      "messages": [
        {
          "mine": false,
          "text": "gehst du auch zum elternabend am donnerstag?"
        },
        {
          "mine": true,
          "text": "ja muss ich, 19 uhr oder?"
        },
        {
          "mine": false,
          "text": "genau, wollen wir zusammen fahren?"
        },
        {
          "mine": true,
          "text": "gerne, ich hol dich um viertel vor ab"
        },
        {
          "mine": false,
          "text": "super, danke dir"
        }
      ]
    },
    {
      "name": "Felix",
      "messages": [
        {
          "mine": true,
          "text": "bist du am wochenende zuhause? würd dir dein buch zurückbringen"
        },
        {
          "mine": false,
          "text": "ja sonntag den ganzen tag"
        },
        {
          "mine": true,
          "text": "gut komm nachmittags vorbei"
        },
        {
          "mine": false,
          "text": "passt, gibts kaffee"
        },
        {
          "mine": true,
          "text": "sehr gern"
        }
      ]
    },
    {
      "name": "Sandra",
      "messages": [
        {
          "mine": false,
          "text": "was ziehst du samstag zur feier an? weiß nicht was passt"
        },
        {
          "mine": true,
          "text": "dachte an das blaue kleid, du?"
        },
        {
          "mine": false,
          "text": "vielleicht meins in grün, ist das zu leger?"
        },
        {
          "mine": true,
          "text": "nee passt total, wird schön"
        },
        {
          "mine": false,
          "text": "gut dann grün, danke"
        }
      ]
    },
    {
      "name": "Dennis",
      "messages": [
        {
          "mine": true,
          "text": "kommst du mir am umzug helfen? sonntag"
        },
        {
          "mine": false,
          "text": "wieviele leute seid ihr?"
        },
        {
          "mine": true,
          "text": "vier, brauchen noch starke arme haha"
        },
        {
          "mine": false,
          "text": "ok bin dabei, ab wann?"
        },
        {
          "mine": true,
          "text": "9 uhr, gibt frühstück vorher"
        },
        {
          "mine": false,
          "text": "na dann bis sonntag"
        }
      ]
    },
    {
      "name": "Katrin",
      "messages": [
        {
          "mine": false,
          "text": "hast du noch die auflaufform von mir?"
        },
        {
          "mine": true,
          "text": "oh ja stimmt, hab sie gespült, bring sie morgen"
        },
        {
          "mine": false,
          "text": "kein stress, brauch sie erst am wochenende"
        },
        {
          "mine": true,
          "text": "dann leg ich sie dir in den briefkasten"
        },
        {
          "mine": false,
          "text": "super danke"
        }
      ]
    },
    {
      "name": "Mareike",
      "messages": [
        {
          "mine": true,
          "text": "wie gehts deiner katze? war sie nicht beim tierarzt?"
        },
        {
          "mine": false,
          "text": "ja alles gut, nur ne kleine erkältung"
        },
        {
          "mine": true,
          "text": "oh gut, dachte schon was schlimmes"
        },
        {
          "mine": false,
          "text": "nein zum glück, schon wieder fit und frech"
        },
        {
          "mine": true,
          "text": "typisch katze haha"
        }
      ]
    },
    {
      "name": "Sven",
      "messages": [
        {
          "mine": false,
          "text": "wann kommt eigentlich unsere neue couch?"
        },
        {
          "mine": true,
          "text": "die liefern nächsten dienstag zwischen 8 und 12"
        },
        {
          "mine": false,
          "text": "ok bleib ich zuhause, muss eh homeoffice machen"
        },
        {
          "mine": true,
          "text": "super, dann passt das ja"
        }
      ]
    },
    {
      "name": "Vroni",
      "messages": [
        {
          "mine": true,
          "text": "hast du lust nächste woche ins schwimmbad zu gehen?"
        },
        {
          "mine": false,
          "text": "au ja, mit den kindern?"
        },
        {
          "mine": true,
          "text": "genau, das neue mit der rutsche"
        },
        {
          "mine": false,
          "text": "die werden ausflippen haha, mittwoch?"
        },
        {
          "mine": true,
          "text": "mittwoch nachmittag, top"
        }
      ]
    },
    {
      "name": "Hanna",
      "messages": [
        {
          "mine": false,
          "text": "kannst du mir dein rezept für die lasagne schicken?"
        },
        {
          "mine": true,
          "text": "klar, mit béchamel oder ricotta?"
        },
        {
          "mine": false,
          "text": "béchamel, so wie du sie immer machst"
        },
        {
          "mine": true,
          "text": "schreib ich dir gleich in ruhe auf"
        },
        {
          "mine": false,
          "text": "danke ♥ freu mich schon"
        }
      ]
    },
    {
      "name": "Robert",
      "messages": [
        {
          "mine": true,
          "text": "läuft dein rasen schon oder wartest du noch?"
        },
        {
          "mine": false,
          "text": "hab schon gemäht, war höchste zeit"
        },
        {
          "mine": true,
          "text": "ich muss auch dringend, samstag mach ichs"
        },
        {
          "mine": false,
          "text": "kannst dir gern meinen vertikutierer leihen danach"
        },
        {
          "mine": true,
          "text": "oh super, nehm ich an"
        }
      ]
    },
    {
      "name": "Ellen",
      "messages": [
        {
          "mine": false,
          "text": "kommst du am sonntag zum brunch? ich mach waffeln"
        },
        {
          "mine": true,
          "text": "oh gerne, soll ich obst mitbringen?"
        },
        {
          "mine": false,
          "text": "ja gern, beeren wären toll"
        },
        {
          "mine": true,
          "text": "hol ich morgen ein, um wieviel uhr?"
        },
        {
          "mine": false,
          "text": "ab 10 uhr, freu mich"
        }
      ]
    },
    {
      "name": "Uwe",
      "messages": [
        {
          "mine": true,
          "text": "kannst du mir samstag beim regal aufbauen helfen?"
        },
        {
          "mine": false,
          "text": "ikea kram? haha klar bin dabei"
        },
        {
          "mine": true,
          "text": "genau der klassiker, ab 14 uhr?"
        },
        {
          "mine": false,
          "text": "passt, bring meinen akkuschrauber mit"
        },
        {
          "mine": true,
          "text": "top, danke"
        }
      ]
    },
    {
      "name": "Bianca",
      "messages": [
        {
          "mine": false,
          "text": "gehst du morgen einkaufen? brauch dringend milch und brot"
        },
        {
          "mine": true,
          "text": "ja fahr nachmittags, kann dir was mitbringen"
        },
        {
          "mine": false,
          "text": "wär lieb, milch, brot und butter"
        },
        {
          "mine": true,
          "text": "schreib ich mir auf, geb ich dir dann"
        },
        {
          "mine": false,
          "text": "danke, du bist ein schatz"
        }
      ]
    },
    {
      "name": "Timo",
      "messages": [
        {
          "mine": true,
          "text": "spielst du am wochenende playstation oder bist unterwegs?"
        },
        {
          "mine": false,
          "text": "sonntag abend hätt ich zeit"
        },
        {
          "mine": true,
          "text": "cool, dann zocken wir ne runde"
        },
        {
          "mine": false,
          "text": "ich schreib dich an wenn ich online bin"
        },
        {
          "mine": true,
          "text": "passt"
        }
      ]
    },
    {
      "name": "Melanie",
      "messages": [
        {
          "mine": false,
          "text": "wie war der elternsprechtag? hab ich verpasst"
        },
        {
          "mine": true,
          "text": "gut, lehrerin ist zufrieden, nur mathe hakt bissl"
        },
        {
          "mine": false,
          "text": "oh das kenn ich, üben wir zusammen mit den kids?"
        },
        {
          "mine": true,
          "text": "gute idee, vielleicht am wochenende"
        },
        {
          "mine": false,
          "text": "machen wir, meld dich"
        }
      ]
    },
    {
      "name": "Christian",
      "messages": [
        {
          "mine": true,
          "text": "kommst du mit zum baumarkt? brauch farbe fürs schlafzimmer"
        },
        {
          "mine": false,
          "text": "welche farbe wirds denn?"
        },
        {
          "mine": true,
          "text": "so ein helles grau, mag ilona"
        },
        {
          "mine": false,
          "text": "schön, ja komm mit, wann?"
        },
        {
          "mine": true,
          "text": "samstag früh, dann ist wenig los"
        },
        {
          "mine": false,
          "text": "top, hol dich ab"
        }
      ]
    },
    {
      "name": "Sabine",
      "messages": [
        {
          "mine": false,
          "text": "hast du noch platz im auto morgen zum markt?"
        },
        {
          "mine": true,
          "text": "ja klar, hol dich um 9?"
        },
        {
          "mine": false,
          "text": "perfekt, ich brauch nur gemüse und eier"
        },
        {
          "mine": true,
          "text": "ich auch, dann machen wir das zusammen"
        },
        {
          "mine": false,
          "text": "super, danke dir"
        }
      ]
    },
    {
      "name": "Andi",
      "messages": [
        {
          "mine": true,
          "text": "geht die grillsaison bei euch schon los?"
        },
        {
          "mine": false,
          "text": "klar, samstag feuern wir an, kommt ihr?"
        },
        {
          "mine": true,
          "text": "gerne, was sollen wir mitbringen?"
        },
        {
          "mine": false,
          "text": "nur salat und gute laune haha"
        },
        {
          "mine": true,
          "text": "beides im gepäck, bis samstag"
        }
      ]
    },
    {
      "name": "Nadine",
      "messages": [
        {
          "mine": false,
          "text": "kannst du morgen die kinder von der schule holen? ich hab termin"
        },
        {
          "mine": true,
          "text": "ja mach ich, um 13 uhr oder?"
        },
        {
          "mine": false,
          "text": "genau, danke dir sehr"
        },
        {
          "mine": true,
          "text": "kein problem, bring sie zu mir bis du kommst"
        },
        {
          "mine": false,
          "text": "super, hol sie dann gegen 15 uhr ab"
        }
      ]
    },
    {
      "name": "Jens",
      "messages": [
        {
          "mine": true,
          "text": "hast du die rechnung für die reparatur bekommen?"
        },
        {
          "mine": false,
          "text": "ja kam heute per post, ist ok soweit"
        },
        {
          "mine": true,
          "text": "gut, dann teilen wir uns das wie besprochen"
        },
        {
          "mine": false,
          "text": "genau, überweis dir meinen anteil morgen"
        },
        {
          "mine": true,
          "text": "passt, danke"
        }
      ]
    },
    {
      "name": "Carla",
      "messages": [
        {
          "mine": false,
          "text": "wollen wir samstag auf den flohmarkt? um die ecke ist einer"
        },
        {
          "mine": true,
          "text": "oh ja, ich such noch ne alte lampe"
        },
        {
          "mine": false,
          "text": "haha da wirst du bestimmt fündig"
        },
        {
          "mine": true,
          "text": "treffen um 10 am eingang?"
        },
        {
          "mine": false,
          "text": "passt, bis dann"
        }
      ]
    },
    {
      "name": "Fabian",
      "messages": [
        {
          "mine": true,
          "text": "kommst du zum grillen am see am wochenende?"
        },
        {
          "mine": false,
          "text": "wetter soll ja gut werden, klar"
        },
        {
          "mine": true,
          "text": "super, ich bring den grill mit"
        },
        {
          "mine": false,
          "text": "ich kümmer mich um getränke"
        },
        {
          "mine": true,
          "text": "top team haha"
        }
      ]
    },
    {
      "name": "Verena",
      "messages": [
        {
          "mine": false,
          "text": "hast du zufällig ne nähmaschine? muss ne hose kürzen"
        },
        {
          "mine": true,
          "text": "ja hab eine, kannst sie leihen"
        },
        {
          "mine": false,
          "text": "oh super, wann kann ich vorbei?"
        },
        {
          "mine": true,
          "text": "heut abend passt, komm nach 18 uhr"
        },
        {
          "mine": false,
          "text": "danke, du rettest mich"
        }
      ]
    },
    {
      "name": "Ralf",
      "messages": [
        {
          "mine": true,
          "text": "geht dein rasenmäher wieder? wolltest ihn reparieren"
        },
        {
          "mine": false,
          "text": "ja läuft, war nur das messer stumpf"
        },
        {
          "mine": true,
          "text": "ah gut, meiner spinnt auch grad"
        },
        {
          "mine": false,
          "text": "bring ihn vorbei, schau ich mir an"
        },
        {
          "mine": true,
          "text": "mega, danke dir"
        }
      ]
    },
    {
      "name": "Simone",
      "messages": [
        {
          "mine": false,
          "text": "was schenken wir eigentlich der oma zum geburtstag?"
        },
        {
          "mine": true,
          "text": "sie wünscht sich ne neue gießkanne haha typisch"
        },
        {
          "mine": false,
          "text": "und vielleicht blumen dazu?"
        },
        {
          "mine": true,
          "text": "gute idee, teilen wir uns das?"
        },
        {
          "mine": false,
          "text": "klar, ich kauf die gießkanne du die blumen"
        },
        {
          "mine": true,
          "text": "abgemacht"
        }
      ]
    },
    {
      "name": "Kai",
      "messages": [
        {
          "mine": true,
          "text": "fährst du am wochenende mit dem rad? wetter passt ja"
        },
        {
          "mine": false,
          "text": "jo dachte an sonntag ne kleine tour"
        },
        {
          "mine": true,
          "text": "darf ich mit? so 30 km?"
        },
        {
          "mine": false,
          "text": "klar, treffen 9 uhr am bäcker"
        },
        {
          "mine": true,
          "text": "erst frühstücken dann fahren, perfekt"
        }
      ]
    },
    {
      "name": "Heike",
      "messages": [
        {
          "mine": false,
          "text": "kommt ihr am sonntag zum kaffee? hab kuchen gebacken"
        },
        {
          "mine": true,
          "text": "oh lecker, welchen?"
        },
        {
          "mine": false,
          "text": "apfelkuchen mit streuseln"
        },
        {
          "mine": true,
          "text": "da können wir nicht nein sagen, kommen um 15 uhr"
        },
        {
          "mine": false,
          "text": "super, freu mich"
        }
      ]
    },
    {
      "name": "Björn",
      "messages": [
        {
          "mine": true,
          "text": "hast du die anhängerkupplung noch von mir?"
        },
        {
          "mine": false,
          "text": "ja steht in der garage, brauchst du sie?"
        },
        {
          "mine": true,
          "text": "ja am wochenende, muss zum wertstoffhof"
        },
        {
          "mine": false,
          "text": "hol sie dir vorher ab, bin da"
        },
        {
          "mine": true,
          "text": "danke, komm freitag"
        }
      ]
    },
    {
      "name": "Ingrid",
      "messages": [
        {
          "mine": false,
          "text": "kannst du mir beim ausfüllen vom formular helfen? die neue karte"
        },
        {
          "mine": true,
          "text": "klar, komm ich vorbei, morgen nachmittag?"
        },
        {
          "mine": false,
          "text": "ja wär lieb, so gegen 15 uhr?"
        },
        {
          "mine": true,
          "text": "passt, bis morgen"
        },
        {
          "mine": false,
          "text": "danke, ich koche uns kaffee"
        }
      ]
    },
    {
      "name": "Lukas",
      "messages": [
        {
          "mine": true,
          "text": "gehst du heut abend noch zum training?"
        },
        {
          "mine": false,
          "text": "ne bin erkältet, bleib zuhause"
        },
        {
          "mine": true,
          "text": "gute besserung, ruh dich aus"
        },
        {
          "mine": false,
          "text": "danke, nächste woche bin ich wieder dabei"
        },
        {
          "mine": true,
          "text": "super, hol dich dann ab"
        }
      ]
    },
    {
      "name": "Steffen",
      "messages": [
        {
          "mine": false,
          "text": "hast du morgen zeit? müssen die schicht für nächste woche planen"
        },
        {
          "mine": true,
          "text": "ja nach der arbeit, so 17 uhr?"
        },
        {
          "mine": false,
          "text": "passt, treffen wir uns im pausenraum"
        },
        {
          "mine": true,
          "text": "gut, bring den plan mit"
        },
        {
          "mine": false,
          "text": "mach ich"
        }
      ]
    },
    {
      "name": "Miriam",
      "messages": [
        {
          "mine": true,
          "text": "kommst du mit zum babykurs am freitag? ich fahr eh"
        },
        {
          "mine": false,
          "text": "ja gerne, spart mir den bus"
        },
        {
          "mine": true,
          "text": "hol dich um 9:30 ab, kurs ist um 10"
        },
        {
          "mine": false,
          "text": "super, warte unten"
        },
        {
          "mine": true,
          "text": "bis freitag"
        }
      ]
    },
    {
      "name": "Torsten",
      "messages": [
        {
          "mine": false,
          "text": "läuft der neue kühlschrank gut? wolltest du ja tauschen"
        },
        {
          "mine": true,
          "text": "ja mega leise und sparsam, top gerät"
        },
        {
          "mine": false,
          "text": "schön, dann tausch ich meinen alten auch bald"
        },
        {
          "mine": true,
          "text": "kann dir das modell schicken wenn du magst"
        },
        {
          "mine": false,
          "text": "ja gern, danke"
        }
      ]
    },
    {
      "name": "Elke",
      "messages": [
        {
          "mine": true,
          "text": "hast du noch die leiter von uns?"
        },
        {
          "mine": false,
          "text": "oh ja stimmt, bring ich am wochenende zurück"
        },
        {
          "mine": true,
          "text": "kein stress, brauch sie erst nächsten monat"
        },
        {
          "mine": false,
          "text": "dann stell ich sie euch einfach in die garage"
        },
        {
          "mine": true,
          "text": "perfekt, danke"
        }
      ]
    },
    {
      "name": "Dominik",
      "messages": [
        {
          "mine": false,
          "text": "zockst du heut abend online? oder machst was mit deiner freundin"
        },
        {
          "mine": true,
          "text": "wir schauen nen film, aber danach vielleicht"
        },
        {
          "mine": false,
          "text": "cool, meld dich einfach"
        },
        {
          "mine": true,
          "text": "mach ich, so gegen 22 uhr"
        },
        {
          "mine": false,
          "text": "passt, bis dann"
        }
      ]
    },
    {
      "name": "Franzi",
      "messages": [
        {
          "mine": true,
          "text": "wie war dein wochenende bei den schwiegereltern?"
        },
        {
          "mine": false,
          "text": "anstrengend aber ok haha, viel gegessen"
        },
        {
          "mine": true,
          "text": "das kenn ich zu gut"
        },
        {
          "mine": false,
          "text": "nächstes mal kommt ihr mit zur ablenkung"
        },
        {
          "mine": true,
          "text": "haha gerne, dann leiden wir zusammen"
        }
      ]
    },
    {
      "name": "Gerd",
      "messages": [
        {
          "mine": false,
          "text": "das gartentor quietscht wieder, hast du öl da?"
        },
        {
          "mine": true,
          "text": "ja hab noch kriechöl, bring ich rüber"
        },
        {
          "mine": false,
          "text": "danke, dann machen wirs gleich zusammen"
        },
        {
          "mine": true,
          "text": "komm in 10 minuten"
        }
      ]
    },
    {
      "name": "Rita",
      "messages": [
        {
          "mine": true,
          "text": "gehst du morgen zum seniorentreff? kann dich mitnehmen"
        },
        {
          "mine": false,
          "text": "oh das wär schön, um 14 uhr fängts an"
        },
        {
          "mine": true,
          "text": "hol dich um viertel vor 2 ab"
        },
        {
          "mine": false,
          "text": "danke kind, ich freu mich immer drauf"
        },
        {
          "mine": true,
          "text": "ich bring dir auch die zeitschrift mit"
        }
      ]
    },
    {
      "name": "Olli",
      "messages": [
        {
          "mine": false,
          "text": "kommst du zum stammtisch am donnerstag?"
        },
        {
          "mine": true,
          "text": "wo trefft ihr euch, im üblichen laden?"
        },
        {
          "mine": false,
          "text": "ja beim wirt an der ecke, 19 uhr"
        },
        {
          "mine": true,
          "text": "bin dabei, freu mich"
        },
        {
          "mine": false,
          "text": "super, dann bis donnerstag"
        }
      ]
    },
    {
      "name": "Susanne",
      "messages": [
        {
          "mine": true,
          "text": "hast du noch tomaten im garten? meine sind noch grün"
        },
        {
          "mine": false,
          "text": "ja massenhaft, komm hol dir welche"
        },
        {
          "mine": true,
          "text": "oh super, dann mach ich sauce ein"
        },
        {
          "mine": false,
          "text": "nimm ruhig ne ganze schüssel voll"
        },
        {
          "mine": true,
          "text": "danke, bring dir dafür marmelade mit"
        }
      ]
    },
    {
      "name": "Matze",
      "messages": [
        {
          "mine": false,
          "text": "leihst du mir dein zelt fürs wochenende? wir campen"
        },
        {
          "mine": true,
          "text": "klar, das große für 4 personen?"
        },
        {
          "mine": false,
          "text": "genau das, wann kann ich es holen?"
        },
        {
          "mine": true,
          "text": "heut abend passt, liegt im keller"
        },
        {
          "mine": false,
          "text": "top, komm nach 18 uhr, danke dir"
        }
      ]
    },
    {
      "name": "Conny",
      "messages": [
        {
          "mine": true,
          "text": "wie läuft die neue arbeitsstelle?"
        },
        {
          "mine": false,
          "text": "ganz gut, kollegen sind nett, nur der weg ist lang"
        },
        {
          "mine": true,
          "text": "wie lange fährst du jetzt?"
        },
        {
          "mine": false,
          "text": "gut 40 minuten mit dem auto"
        },
        {
          "mine": true,
          "text": "puh, aber hauptsache es gefällt dir"
        },
        {
          "mine": false,
          "text": "ja bin echt zufrieden"
        }
      ]
    },
    {
      "name": "Oma Helga",
      "messages": [
        {
          "mine": false,
          "text": "bringst du mir am samstag die medikamente aus der apotheke mit?"
        },
        {
          "mine": true,
          "text": "na klar oma, das rezept liegt bei dir?"
        },
        {
          "mine": false,
          "text": "ja auf dem küchentisch, ich leg es raus"
        },
        {
          "mine": true,
          "text": "gut, komm dann gegen mittag vorbei"
        },
        {
          "mine": false,
          "text": "ich koch dir was leckeres ♥"
        },
        {
          "mine": true,
          "text": "freu mich schon, bis samstag"
        }
      ]
    }
  ],
  "en": [
    {
      "name": "Mom",
      "messages": [
        {
          "mine": false,
          "text": "are you coming over sunday for dinner?"
        },
        {
          "mine": true,
          "text": "yeah should be there around 5"
        },
        {
          "mine": false,
          "text": "great, im making the lasagna you like"
        },
        {
          "mine": true,
          "text": "oh nice can i bring anything?"
        },
        {
          "mine": false,
          "text": "just some bread maybe, we're low"
        },
        {
          "mine": true,
          "text": "ok will grab a loaf on the way"
        }
      ]
    },
    {
      "name": "Dad",
      "messages": [
        {
          "mine": true,
          "text": "did the car pass inspection?"
        },
        {
          "mine": false,
          "text": "yeah barely lol, needed new wipers"
        },
        {
          "mine": true,
          "text": "how much was it"
        },
        {
          "mine": false,
          "text": "about 40 with the labor"
        },
        {
          "mine": true,
          "text": "not bad. thanks for taking it in"
        },
        {
          "mine": false,
          "text": "no problem, it's back in the driveway"
        }
      ]
    },
    {
      "name": "Sarah",
      "messages": [
        {
          "mine": false,
          "text": "you free saturday? thinking coffee"
        },
        {
          "mine": true,
          "text": "yes! the place on maple st?"
        },
        {
          "mine": false,
          "text": "perfect, 10am work?"
        },
        {
          "mine": true,
          "text": "make it 10:30 i need to walk the dog first"
        },
        {
          "mine": false,
          "text": "haha ok 10:30. see you then"
        }
      ]
    },
    {
      "name": "Grandma",
      "messages": [
        {
          "mine": false,
          "text": "thank you for the flowers dear they are lovely"
        },
        {
          "mine": true,
          "text": "so glad you liked them! happy birthday again"
        },
        {
          "mine": false,
          "text": "you are too sweet. come visit soon"
        },
        {
          "mine": true,
          "text": "i will next weekend i promise"
        }
      ]
    },
    {
      "name": "Mike the plumber",
      "messages": [
        {
          "mine": true,
          "text": "hi, the kitchen sink is dripping again"
        },
        {
          "mine": false,
          "text": "the same one i fixed last month?"
        },
        {
          "mine": true,
          "text": "yeah under the trap i think"
        },
        {
          "mine": false,
          "text": "can swing by thursday afternoon"
        },
        {
          "mine": true,
          "text": "that works, thanks mike"
        },
        {
          "mine": false,
          "text": "no worries, ill text when im on the way"
        }
      ]
    },
    {
      "name": "Jess",
      "messages": [
        {
          "mine": false,
          "text": "omg did you see it started snowing"
        },
        {
          "mine": true,
          "text": "yes! wasnt supposed to till tomorrow"
        },
        {
          "mine": false,
          "text": "my car is already covered ugh"
        },
        {
          "mine": true,
          "text": "leave early for work then, roads gonna be slow"
        },
        {
          "mine": false,
          "text": "good call. bundle up"
        }
      ]
    },
    {
      "name": "Uncle Rob",
      "messages": [
        {
          "mine": true,
          "text": "you still got my drill? need it this weekend"
        },
        {
          "mine": false,
          "text": "oh yeah sorry, ill drop it off tomorrow"
        },
        {
          "mine": true,
          "text": "no rush, just building some shelves"
        },
        {
          "mine": false,
          "text": "nice, need a hand with those?"
        },
        {
          "mine": true,
          "text": "maybe! ill let you know"
        }
      ]
    },
    {
      "name": "Tom",
      "messages": [
        {
          "mine": false,
          "text": "can you cover my shift friday? something came up"
        },
        {
          "mine": true,
          "text": "morning or evening?"
        },
        {
          "mine": false,
          "text": "evening, 4 to 10"
        },
        {
          "mine": true,
          "text": "yeah i can do it"
        },
        {
          "mine": false,
          "text": "you're a lifesaver thanks man"
        },
        {
          "mine": true,
          "text": "np you owe me one lol"
        }
      ]
    },
    {
      "name": "Katie",
      "messages": [
        {
          "mine": true,
          "text": "what time is the parent teacher thing again"
        },
        {
          "mine": false,
          "text": "6:30 in the gym"
        },
        {
          "mine": true,
          "text": "ok i might be 5 min late"
        },
        {
          "mine": false,
          "text": "thats fine save me a seat"
        },
        {
          "mine": true,
          "text": "will do"
        }
      ]
    },
    {
      "name": "Ben",
      "messages": [
        {
          "mine": false,
          "text": "hey did the amazon package come to your place by mistake?"
        },
        {
          "mine": true,
          "text": "let me check the porch"
        },
        {
          "mine": true,
          "text": "yeah theres a box here for you"
        },
        {
          "mine": false,
          "text": "oh awesome ill grab it after work"
        },
        {
          "mine": true,
          "text": "cool ill leave it inside so it doesnt get wet"
        }
      ]
    },
    {
      "name": "Hair salon",
      "messages": [
        {
          "mine": false,
          "text": "hi confirming your appointment tuesday at 2"
        },
        {
          "mine": true,
          "text": "yes ill be there"
        },
        {
          "mine": false,
          "text": "great see you then!"
        },
        {
          "mine": true,
          "text": "can i also do a trim for my son same day?"
        },
        {
          "mine": false,
          "text": "sure we can fit him in at 2:30"
        }
      ]
    },
    {
      "name": "Aunt Linda",
      "messages": [
        {
          "mine": false,
          "text": "are you bringing the kids to the picnic?"
        },
        {
          "mine": true,
          "text": "yes both of them, so excited"
        },
        {
          "mine": false,
          "text": "wonderful! i'm making my potato salad"
        },
        {
          "mine": true,
          "text": "yum. want me to bring drinks?"
        },
        {
          "mine": false,
          "text": "that would be great, some lemonade maybe"
        },
        {
          "mine": true,
          "text": "done"
        }
      ]
    },
    {
      "name": "Chris",
      "messages": [
        {
          "mine": true,
          "text": "gym at 7 tomorrow?"
        },
        {
          "mine": false,
          "text": "ugh cant, kids got a dentist thing"
        },
        {
          "mine": true,
          "text": "lame, day after?"
        },
        {
          "mine": false,
          "text": "yeah wednesday works"
        },
        {
          "mine": true,
          "text": "cool see you then"
        }
      ]
    },
    {
      "name": "Emma",
      "messages": [
        {
          "mine": false,
          "text": "do you have that book i lent you?"
        },
        {
          "mine": true,
          "text": "omg yes sorry i totally forgot"
        },
        {
          "mine": false,
          "text": "no worries just wanted to reread it"
        },
        {
          "mine": true,
          "text": "ill bring it to work monday"
        },
        {
          "mine": false,
          "text": "thanks!"
        }
      ]
    },
    {
      "name": "Dr office",
      "messages": [
        {
          "mine": false,
          "text": "reminder: your checkup is thursday 9:15am"
        },
        {
          "mine": true,
          "text": "thanks, do i need to fast for it?"
        },
        {
          "mine": false,
          "text": "no fasting required for this visit"
        },
        {
          "mine": true,
          "text": "perfect see you thursday"
        }
      ]
    },
    {
      "name": "Nate",
      "messages": [
        {
          "mine": true,
          "text": "you watching the game tonight?"
        },
        {
          "mine": false,
          "text": "yeah come over i got snacks"
        },
        {
          "mine": true,
          "text": "nice ill bring some soda"
        },
        {
          "mine": false,
          "text": "and chips we're out"
        },
        {
          "mine": true,
          "text": "ok chips and soda got it"
        }
      ]
    },
    {
      "name": "Rachel",
      "messages": [
        {
          "mine": false,
          "text": "can you pick up the kids today? im stuck at work"
        },
        {
          "mine": true,
          "text": "yeah no problem, regular time?"
        },
        {
          "mine": false,
          "text": "yes 3:15 at the side gate"
        },
        {
          "mine": true,
          "text": "got it, ill be there"
        },
        {
          "mine": false,
          "text": "thank you so much"
        }
      ]
    },
    {
      "name": "Landlord",
      "messages": [
        {
          "mine": true,
          "text": "hi, the heating in the bedroom isnt working"
        },
        {
          "mine": false,
          "text": "ill send someone to look at it monday"
        },
        {
          "mine": true,
          "text": "ok thanks, its pretty cold"
        },
        {
          "mine": false,
          "text": "sorry about that, use the space heater for now"
        }
      ]
    },
    {
      "name": "Steve",
      "messages": [
        {
          "mine": false,
          "text": "still on for golf sunday?"
        },
        {
          "mine": true,
          "text": "weather looks iffy but yeah"
        },
        {
          "mine": false,
          "text": "tee time is 8:40"
        },
        {
          "mine": true,
          "text": "ill be there, bringing coffee"
        },
        {
          "mine": false,
          "text": "legend"
        }
      ]
    },
    {
      "name": "Grandpa",
      "messages": [
        {
          "mine": true,
          "text": "how are you feeling today grandpa?"
        },
        {
          "mine": false,
          "text": "much better thanks for asking"
        },
        {
          "mine": true,
          "text": "good! i'll stop by with soup later"
        },
        {
          "mine": false,
          "text": "you don't have to but i won't say no"
        },
        {
          "mine": true,
          "text": "haha see you soon"
        }
      ]
    },
    {
      "name": "Priya",
      "messages": [
        {
          "mine": false,
          "text": "did you get the invite for the baby shower?"
        },
        {
          "mine": true,
          "text": "yes! cant wait, when do we need to rsvp"
        },
        {
          "mine": false,
          "text": "by the 15th"
        },
        {
          "mine": true,
          "text": "ok ill do it tonight"
        },
        {
          "mine": false,
          "text": "we should carpool"
        },
        {
          "mine": true,
          "text": "good idea ill drive"
        }
      ]
    },
    {
      "name": "Dave",
      "messages": [
        {
          "mine": true,
          "text": "meeting moved to 3 btw"
        },
        {
          "mine": false,
          "text": "ugh i have a call at 3"
        },
        {
          "mine": true,
          "text": "can you join late?"
        },
        {
          "mine": false,
          "text": "yeah ill jump in around 3:20"
        },
        {
          "mine": true,
          "text": "cool ill fill you in"
        }
      ]
    },
    {
      "name": "Megan",
      "messages": [
        {
          "mine": false,
          "text": "the recipe you sent was amazing"
        },
        {
          "mine": true,
          "text": "right?? so easy too"
        },
        {
          "mine": false,
          "text": "my kids actually ate the veggies lol"
        },
        {
          "mine": true,
          "text": "win! i add a little garlic next time"
        },
        {
          "mine": false,
          "text": "ooh good tip"
        }
      ]
    },
    {
      "name": "Josh",
      "messages": [
        {
          "mine": true,
          "text": "you still selling that old bike?"
        },
        {
          "mine": false,
          "text": "yeah i am, you interested?"
        },
        {
          "mine": true,
          "text": "maybe for my nephew, whats the price"
        },
        {
          "mine": false,
          "text": "50 bucks, its in good shape"
        },
        {
          "mine": true,
          "text": "deal, ill come by saturday"
        }
      ]
    },
    {
      "name": "Lucy",
      "messages": [
        {
          "mine": false,
          "text": "running 10 min late, traffic is nuts"
        },
        {
          "mine": true,
          "text": "no worries ill grab us a table"
        },
        {
          "mine": false,
          "text": "get me a water pls"
        },
        {
          "mine": true,
          "text": "already done"
        },
        {
          "mine": false,
          "text": "youre the best"
        }
      ]
    },
    {
      "name": "Vet clinic",
      "messages": [
        {
          "mine": false,
          "text": "max is due for his shots, want to schedule?"
        },
        {
          "mine": true,
          "text": "yes please, any time next week"
        },
        {
          "mine": false,
          "text": "we have tuesday 11am open"
        },
        {
          "mine": true,
          "text": "that works, thank you"
        },
        {
          "mine": false,
          "text": "see max then!"
        }
      ]
    },
    {
      "name": "Carla",
      "messages": [
        {
          "mine": true,
          "text": "what did you think of the new coffee shop"
        },
        {
          "mine": false,
          "text": "honestly overpriced but the muffins slap"
        },
        {
          "mine": true,
          "text": "lol the muffins were huge"
        },
        {
          "mine": false,
          "text": "we're going back for sure"
        },
        {
          "mine": true,
          "text": "agreed, next week?"
        }
      ]
    },
    {
      "name": "Kevin",
      "messages": [
        {
          "mine": false,
          "text": "can you swing by the store, we need milk and eggs"
        },
        {
          "mine": true,
          "text": "sure anything else?"
        },
        {
          "mine": false,
          "text": "oh and paper towels"
        },
        {
          "mine": true,
          "text": "milk eggs paper towels, got it"
        },
        {
          "mine": false,
          "text": "thank you love"
        }
      ]
    },
    {
      "name": "Sophie",
      "messages": [
        {
          "mine": false,
          "text": "happy friday!! any plans this weekend"
        },
        {
          "mine": true,
          "text": "nothing much, might repaint the fence"
        },
        {
          "mine": false,
          "text": "ooh fancy, what color"
        },
        {
          "mine": true,
          "text": "just white again lol"
        },
        {
          "mine": false,
          "text": "classic never fails"
        }
      ]
    },
    {
      "name": "Coach Dan",
      "messages": [
        {
          "mine": false,
          "text": "practice cancelled tomorrow, field is flooded"
        },
        {
          "mine": true,
          "text": "ok thanks for letting us know"
        },
        {
          "mine": false,
          "text": "rescheduling for thursday same time"
        },
        {
          "mine": true,
          "text": "got it, ill tell him"
        }
      ]
    },
    {
      "name": "Anna",
      "messages": [
        {
          "mine": true,
          "text": "did you find your keys?"
        },
        {
          "mine": false,
          "text": "yes!! they were in my coat pocket the whole time"
        },
        {
          "mine": true,
          "text": "lol classic"
        },
        {
          "mine": false,
          "text": "i felt so dumb"
        },
        {
          "mine": true,
          "text": "we've all been there"
        }
      ]
    },
    {
      "name": "Marcus",
      "messages": [
        {
          "mine": false,
          "text": "hey can i borrow your ladder this weekend"
        },
        {
          "mine": true,
          "text": "sure, cleaning gutters?"
        },
        {
          "mine": false,
          "text": "yeah before the leaves get worse"
        },
        {
          "mine": true,
          "text": "its in the garage, come grab it whenever"
        },
        {
          "mine": false,
          "text": "appreciate it"
        }
      ]
    },
    {
      "name": "Nina",
      "messages": [
        {
          "mine": true,
          "text": "lunch tomorrow? that thai place?"
        },
        {
          "mine": false,
          "text": "yes im craving pad thai"
        },
        {
          "mine": true,
          "text": "noon good?"
        },
        {
          "mine": false,
          "text": "perfect, ill meet you there"
        },
        {
          "mine": true,
          "text": "see ya"
        }
      ]
    },
    {
      "name": "Paul",
      "messages": [
        {
          "mine": false,
          "text": "the printer at work is jammed again"
        },
        {
          "mine": true,
          "text": "ugh not again, try the back tray"
        },
        {
          "mine": false,
          "text": "oh that worked, thanks"
        },
        {
          "mine": true,
          "text": "it always does haha"
        }
      ]
    },
    {
      "name": "Hannah",
      "messages": [
        {
          "mine": false,
          "text": "are we still doing the book club thursday"
        },
        {
          "mine": true,
          "text": "yes my house this time"
        },
        {
          "mine": false,
          "text": "want me to bring wine or snacks"
        },
        {
          "mine": true,
          "text": "snacks would be great"
        },
        {
          "mine": false,
          "text": "on it, see you thursday"
        }
      ]
    },
    {
      "name": "Jake",
      "messages": [
        {
          "mine": true,
          "text": "you left your jacket at my place"
        },
        {
          "mine": false,
          "text": "oh thats where it was!"
        },
        {
          "mine": true,
          "text": "ill bring it monday"
        },
        {
          "mine": false,
          "text": "thanks man appreciate it"
        }
      ]
    },
    {
      "name": "Olivia",
      "messages": [
        {
          "mine": false,
          "text": "the weather is finally nice, park day?"
        },
        {
          "mine": true,
          "text": "yes! lets take the kids"
        },
        {
          "mine": false,
          "text": "i'll pack a picnic"
        },
        {
          "mine": true,
          "text": "ooh and frisbee"
        },
        {
          "mine": false,
          "text": "meet at 11?"
        },
        {
          "mine": true,
          "text": "perfect"
        }
      ]
    },
    {
      "name": "George",
      "messages": [
        {
          "mine": true,
          "text": "can you feed the cat while im away next week?"
        },
        {
          "mine": false,
          "text": "of course, just the dry food?"
        },
        {
          "mine": true,
          "text": "yeah two scoops morning and night"
        },
        {
          "mine": false,
          "text": "easy, have a good trip"
        },
        {
          "mine": true,
          "text": "thank you so much"
        }
      ]
    },
    {
      "name": "Tina",
      "messages": [
        {
          "mine": false,
          "text": "did you ever return the drill to rob"
        },
        {
          "mine": true,
          "text": "not yet, keep forgetting"
        },
        {
          "mine": false,
          "text": "its been like 3 weeks lol"
        },
        {
          "mine": true,
          "text": "i know i know, doing it today"
        },
        {
          "mine": false,
          "text": "suuure"
        }
      ]
    },
    {
      "name": "Ryan",
      "messages": [
        {
          "mine": true,
          "text": "what time does the hardware store close"
        },
        {
          "mine": false,
          "text": "i think 8 on weekdays"
        },
        {
          "mine": true,
          "text": "cool need to grab some screws"
        },
        {
          "mine": false,
          "text": "grab me some too while youre there, wood ones"
        },
        {
          "mine": true,
          "text": "how many"
        },
        {
          "mine": false,
          "text": "just a small box"
        }
      ]
    },
    {
      "name": "Grace",
      "messages": [
        {
          "mine": false,
          "text": "how was the dentist"
        },
        {
          "mine": true,
          "text": "fine, no cavities thank god"
        },
        {
          "mine": false,
          "text": "nice! mine is next week dreading it"
        },
        {
          "mine": true,
          "text": "youll be fine, just floss more lol"
        },
        {
          "mine": false,
          "text": "ha yeah yeah"
        }
      ]
    },
    {
      "name": "Sam",
      "messages": [
        {
          "mine": true,
          "text": "are you bringing the tent to camping?"
        },
        {
          "mine": false,
          "text": "yeah the big one, sleeps 4"
        },
        {
          "mine": true,
          "text": "perfect ill bring the cooler"
        },
        {
          "mine": false,
          "text": "dont forget marshmallows"
        },
        {
          "mine": true,
          "text": "never lol"
        }
      ]
    },
    {
      "name": "Beth",
      "messages": [
        {
          "mine": false,
          "text": "can we push our call to 4? kids nap till then"
        },
        {
          "mine": true,
          "text": "sure 4 works better for me anyway"
        },
        {
          "mine": false,
          "text": "perfect thanks"
        },
        {
          "mine": true,
          "text": "talk then"
        }
      ]
    },
    {
      "name": "Danny",
      "messages": [
        {
          "mine": true,
          "text": "the traffic on the highway is brutal today"
        },
        {
          "mine": false,
          "text": "take the back roads by the school"
        },
        {
          "mine": true,
          "text": "good idea, thanks"
        },
        {
          "mine": false,
          "text": "drive safe"
        }
      ]
    },
    {
      "name": "Isabel",
      "messages": [
        {
          "mine": false,
          "text": "i made too much soup, want some?"
        },
        {
          "mine": true,
          "text": "always yes, what kind"
        },
        {
          "mine": false,
          "text": "chicken noodle"
        },
        {
          "mine": true,
          "text": "perfect for this cold weather"
        },
        {
          "mine": false,
          "text": "ill bring a container over tonight"
        },
        {
          "mine": true,
          "text": "youre an angel"
        }
      ]
    },
    {
      "name": "Frank",
      "messages": [
        {
          "mine": true,
          "text": "hey did the mechanic call about the brakes?"
        },
        {
          "mine": false,
          "text": "yeah theyre done, ready for pickup"
        },
        {
          "mine": true,
          "text": "how much damage"
        },
        {
          "mine": false,
          "text": "less than we feared, 220"
        },
        {
          "mine": true,
          "text": "oh not terrible, ill grab it after 5"
        }
      ]
    },
    {
      "name": "Maya",
      "messages": [
        {
          "mine": false,
          "text": "did you sign up for the school bake sale"
        },
        {
          "mine": true,
          "text": "yes im doing brownies"
        },
        {
          "mine": false,
          "text": "i'll do cookies then so we dont overlap"
        },
        {
          "mine": true,
          "text": "good thinking"
        },
        {
          "mine": false,
          "text": "drop off is by 8am fyi"
        },
        {
          "mine": true,
          "text": "noted"
        }
      ]
    },
    {
      "name": "Leo",
      "messages": [
        {
          "mine": true,
          "text": "you around this weekend to help me move a couch?"
        },
        {
          "mine": false,
          "text": "yeah saturday morning?"
        },
        {
          "mine": true,
          "text": "perfect, itll be quick"
        },
        {
          "mine": false,
          "text": "ill bring my truck"
        },
        {
          "mine": true,
          "text": "lifesaver, ill buy lunch after"
        }
      ]
    },
    {
      "name": "Ellie",
      "messages": [
        {
          "mine": false,
          "text": "what should i get mom for her birthday"
        },
        {
          "mine": true,
          "text": "she mentioned wanting a new kettle"
        },
        {
          "mine": false,
          "text": "oh perfect ill get that"
        },
        {
          "mine": true,
          "text": "we can split it if you want"
        },
        {
          "mine": false,
          "text": "yeah lets do that"
        }
      ]
    },
    {
      "name": "Tony",
      "messages": [
        {
          "mine": true,
          "text": "is the office open on friday? its a holiday right"
        },
        {
          "mine": false,
          "text": "nope closed, long weekend baby"
        },
        {
          "mine": true,
          "text": "oh nice i forgot"
        },
        {
          "mine": false,
          "text": "enjoy the extra day off"
        }
      ]
    },
    {
      "name": "Wendy",
      "messages": [
        {
          "mine": false,
          "text": "the neighbors dog got out again"
        },
        {
          "mine": true,
          "text": "oh no is he ok"
        },
        {
          "mine": false,
          "text": "yeah i put him back in the yard"
        },
        {
          "mine": true,
          "text": "good, that fence needs fixing"
        },
        {
          "mine": false,
          "text": "ill mention it to them"
        }
      ]
    },
    {
      "name": "Alex",
      "messages": [
        {
          "mine": true,
          "text": "wanna split an uber to the airport?"
        },
        {
          "mine": false,
          "text": "yes! what time is your flight"
        },
        {
          "mine": true,
          "text": "2pm so leave by 11ish"
        },
        {
          "mine": false,
          "text": "perfect mine is 2:30"
        },
        {
          "mine": true,
          "text": "ill book it, pick you up first"
        }
      ]
    },
    {
      "name": "Julia",
      "messages": [
        {
          "mine": false,
          "text": "the kids school called, half day tomorrow"
        },
        {
          "mine": true,
          "text": "ugh really, who's picking up"
        },
        {
          "mine": false,
          "text": "can you? i have that meeting"
        },
        {
          "mine": true,
          "text": "yeah ill leave early, noon pickup?"
        },
        {
          "mine": false,
          "text": "yes noon, thank you"
        }
      ]
    },
    {
      "name": "Pete",
      "messages": [
        {
          "mine": true,
          "text": "you get the new lawnmower yet?"
        },
        {
          "mine": false,
          "text": "yeah works great, so much faster"
        },
        {
          "mine": true,
          "text": "nice, mind if i borrow it sunday"
        },
        {
          "mine": false,
          "text": "go for it, its in the shed"
        },
        {
          "mine": true,
          "text": "thanks buddy"
        }
      ]
    },
    {
      "name": "Zoe",
      "messages": [
        {
          "mine": false,
          "text": "coffee ran out at the office send help lol"
        },
        {
          "mine": true,
          "text": "ill grab a bag on my way in"
        },
        {
          "mine": false,
          "text": "you are my hero"
        },
        {
          "mine": true,
          "text": "the good kind or the cheap kind"
        },
        {
          "mine": false,
          "text": "good kind obviously"
        }
      ]
    },
    {
      "name": "Harry",
      "messages": [
        {
          "mine": true,
          "text": "is your wifi down too or just mine"
        },
        {
          "mine": false,
          "text": "mine's fine, try restarting the router"
        },
        {
          "mine": true,
          "text": "ok trying that now"
        },
        {
          "mine": true,
          "text": "ok its back, thanks"
        },
        {
          "mine": false,
          "text": "classic fix lol"
        }
      ]
    },
    {
      "name": "Ruth",
      "messages": [
        {
          "mine": false,
          "text": "the tomatoes in the garden are finally ripe"
        },
        {
          "mine": true,
          "text": "ooh can i grab a few"
        },
        {
          "mine": false,
          "text": "take as many as you want theyre everywhere"
        },
        {
          "mine": true,
          "text": "ill make a big salad, thank you"
        },
        {
          "mine": false,
          "text": "enjoy!"
        }
      ]
    },
    {
      "name": "Colin",
      "messages": [
        {
          "mine": true,
          "text": "did we get the shift schedule for next week yet"
        },
        {
          "mine": false,
          "text": "yeah just posted, youre on tue thu sat"
        },
        {
          "mine": true,
          "text": "oh perfect that works"
        },
        {
          "mine": false,
          "text": "i traded to get sunday off finally"
        },
        {
          "mine": true,
          "text": "nice, enjoy it"
        }
      ]
    },
    {
      "name": "Fiona",
      "messages": [
        {
          "mine": false,
          "text": "the bus was so late this morning ugh"
        },
        {
          "mine": true,
          "text": "again? they need to fix that route"
        },
        {
          "mine": false,
          "text": "i was 15 min late to work"
        },
        {
          "mine": true,
          "text": "lame, at least the boss is chill"
        },
        {
          "mine": false,
          "text": "true"
        }
      ]
    },
    {
      "name": "Neighbor Joe",
      "messages": [
        {
          "mine": false,
          "text": "got a package for you, keeping it safe"
        },
        {
          "mine": true,
          "text": "oh thanks joe! ill grab it this evening"
        },
        {
          "mine": false,
          "text": "no rush, its on my porch"
        },
        {
          "mine": true,
          "text": "appreciate you"
        }
      ]
    },
    {
      "name": "Amber",
      "messages": [
        {
          "mine": true,
          "text": "your plant looks so much better!"
        },
        {
          "mine": false,
          "text": "right? i finally figured out the watering"
        },
        {
          "mine": true,
          "text": "whats the secret"
        },
        {
          "mine": false,
          "text": "less water than you think honestly"
        },
        {
          "mine": true,
          "text": "noted, mine keeps dying"
        }
      ]
    },
    {
      "name": "Gary",
      "messages": [
        {
          "mine": false,
          "text": "you left the porch light on all night btw"
        },
        {
          "mine": true,
          "text": "oh whoops thanks for telling me"
        },
        {
          "mine": false,
          "text": "no biggie just saw it walking the dog"
        },
        {
          "mine": true,
          "text": "gonna get one of those timer things"
        }
      ]
    },
    {
      "name": "Debbie",
      "messages": [
        {
          "mine": false,
          "text": "is 6pm still good for dinner saturday"
        },
        {
          "mine": true,
          "text": "yes! where are we going again"
        },
        {
          "mine": false,
          "text": "that italian place downtown"
        },
        {
          "mine": true,
          "text": "oh yum, ill make a reservation"
        },
        {
          "mine": false,
          "text": "for 4 right, we're bringing the kids"
        },
        {
          "mine": true,
          "text": "table for 4 got it"
        }
      ]
    },
    {
      "name": "Oscar",
      "messages": [
        {
          "mine": true,
          "text": "hey the tv remote isnt working, batteries?"
        },
        {
          "mine": false,
          "text": "yeah theres spares in the kitchen drawer"
        },
        {
          "mine": true,
          "text": "found them thanks"
        },
        {
          "mine": false,
          "text": "the junk drawer always comes through"
        }
      ]
    },
    {
      "name": "Claire",
      "messages": [
        {
          "mine": false,
          "text": "omg my hair appointment got cancelled"
        },
        {
          "mine": true,
          "text": "noo right before the wedding?"
        },
        {
          "mine": false,
          "text": "yes im panicking a little"
        },
        {
          "mine": true,
          "text": "try the salon on 5th they got me in last minute once"
        },
        {
          "mine": false,
          "text": "calling now thank you"
        }
      ]
    },
    {
      "name": "Bill",
      "messages": [
        {
          "mine": true,
          "text": "you got plans for the long weekend?"
        },
        {
          "mine": false,
          "text": "just gonna relax, maybe fix the deck"
        },
        {
          "mine": true,
          "text": "same honestly, deck season lol"
        },
        {
          "mine": false,
          "text": "we're getting old man"
        },
        {
          "mine": true,
          "text": "speak for yourself haha"
        }
      ]
    },
    {
      "name": "Nadia",
      "messages": [
        {
          "mine": false,
          "text": "can you grab bread on the way home"
        },
        {
          "mine": true,
          "text": "sure white or wheat"
        },
        {
          "mine": false,
          "text": "wheat please"
        },
        {
          "mine": true,
          "text": "anything else"
        },
        {
          "mine": false,
          "text": "nope thats it thanks"
        }
      ]
    },
    {
      "name": "Eric",
      "messages": [
        {
          "mine": true,
          "text": "the new episode is out, no spoilers"
        },
        {
          "mine": false,
          "text": "i havent watched yet either lets do it friday"
        },
        {
          "mine": true,
          "text": "deal, my place with pizza"
        },
        {
          "mine": false,
          "text": "perfect ill bring drinks"
        }
      ]
    },
    {
      "name": "Mrs Patel",
      "messages": [
        {
          "mine": false,
          "text": "hi, just a reminder homework is due monday"
        },
        {
          "mine": true,
          "text": "thanks, he's almost done with it"
        },
        {
          "mine": false,
          "text": "wonderful, have a good weekend"
        },
        {
          "mine": true,
          "text": "you too!"
        }
      ]
    },
    {
      "name": "Liam",
      "messages": [
        {
          "mine": true,
          "text": "whats the wifi password at your place again"
        },
        {
          "mine": false,
          "text": "its on the fridge magnet lol"
        },
        {
          "mine": true,
          "text": "oh duh found it"
        },
        {
          "mine": false,
          "text": "classic"
        }
      ]
    },
    {
      "name": "Sandra",
      "messages": [
        {
          "mine": false,
          "text": "did the plumber ever come fix your sink"
        },
        {
          "mine": true,
          "text": "yeah finally, good as new"
        },
        {
          "mine": false,
          "text": "oh good, was it expensive"
        },
        {
          "mine": true,
          "text": "nah just a washer, cheap fix"
        },
        {
          "mine": false,
          "text": "lucky"
        }
      ]
    },
    {
      "name": "Victor",
      "messages": [
        {
          "mine": true,
          "text": "you want to carpool to the meeting tomorrow"
        },
        {
          "mine": false,
          "text": "yeah that'd be great, save on parking"
        },
        {
          "mine": true,
          "text": "ill pick you up at 8:15"
        },
        {
          "mine": false,
          "text": "ill be ready, thanks"
        }
      ]
    },
    {
      "name": "Holly",
      "messages": [
        {
          "mine": false,
          "text": "the farmers market has strawberries now!"
        },
        {
          "mine": true,
          "text": "oh i love those, going saturday?"
        },
        {
          "mine": false,
          "text": "yeah wanna come with"
        },
        {
          "mine": true,
          "text": "yes! meet at the entrance"
        },
        {
          "mine": false,
          "text": "9am before it gets crowded"
        },
        {
          "mine": true,
          "text": "deal"
        }
      ]
    },
    {
      "name": "Martin",
      "messages": [
        {
          "mine": true,
          "text": "how'd the interview go?"
        },
        {
          "mine": false,
          "text": "pretty good i think! they said theyd call friday"
        },
        {
          "mine": true,
          "text": "fingers crossed man"
        },
        {
          "mine": false,
          "text": "thanks, i really want this one"
        },
        {
          "mine": true,
          "text": "youll get it"
        }
      ]
    },
    {
      "name": "Diane",
      "messages": [
        {
          "mine": false,
          "text": "the school play is next thursday, you coming?"
        },
        {
          "mine": true,
          "text": "of course! what time"
        },
        {
          "mine": false,
          "text": "7pm, doors at 6:30"
        },
        {
          "mine": true,
          "text": "ill be there early to get good seats"
        },
        {
          "mine": false,
          "text": "perfect, she's so excited"
        }
      ]
    },
    {
      "name": "Andy",
      "messages": [
        {
          "mine": true,
          "text": "grabbing lunch, want anything?"
        },
        {
          "mine": false,
          "text": "ooh yeah a sandwich if youre going to the deli"
        },
        {
          "mine": true,
          "text": "turkey club?"
        },
        {
          "mine": false,
          "text": "you know me so well"
        },
        {
          "mine": true,
          "text": "back in 20"
        }
      ]
    },
    {
      "name": "Rosa",
      "messages": [
        {
          "mine": false,
          "text": "your recipe for the cake, do you use butter or oil"
        },
        {
          "mine": true,
          "text": "butter, makes it richer"
        },
        {
          "mine": false,
          "text": "ok and how long in the oven"
        },
        {
          "mine": true,
          "text": "35 min at 350, check with a toothpick"
        },
        {
          "mine": false,
          "text": "perfect thank you!"
        }
      ]
    },
    {
      "name": "Simon",
      "messages": [
        {
          "mine": true,
          "text": "movie night still on?"
        },
        {
          "mine": false,
          "text": "yeah but can we start at 8 instead"
        },
        {
          "mine": true,
          "text": "sure works for me"
        },
        {
          "mine": false,
          "text": "cool ordering popcorn as we speak"
        }
      ]
    },
    {
      "name": "Brenda",
      "messages": [
        {
          "mine": false,
          "text": "can you drop the kids at soccer? my car's in the shop"
        },
        {
          "mine": true,
          "text": "yeah no problem, what time"
        },
        {
          "mine": false,
          "text": "9am at the field"
        },
        {
          "mine": true,
          "text": "got it, ill grab them at 8:45"
        },
        {
          "mine": false,
          "text": "thank you so much"
        }
      ]
    },
    {
      "name": "Carlos",
      "messages": [
        {
          "mine": true,
          "text": "the game got rained out"
        },
        {
          "mine": false,
          "text": "ugh seriously? third time this month"
        },
        {
          "mine": true,
          "text": "i know, rescheduled for sunday"
        },
        {
          "mine": false,
          "text": "ok ill be there, bring the umbrella just in case"
        },
        {
          "mine": true,
          "text": "lol good idea"
        }
      ]
    },
    {
      "name": "Faye",
      "messages": [
        {
          "mine": false,
          "text": "do you have a spare phone charger i can borrow"
        },
        {
          "mine": true,
          "text": "yeah the usb c one right"
        },
        {
          "mine": false,
          "text": "yes please, mine died"
        },
        {
          "mine": true,
          "text": "ill bring it tomorrow"
        },
        {
          "mine": false,
          "text": "lifesaver thanks"
        }
      ]
    },
    {
      "name": "Roger",
      "messages": [
        {
          "mine": true,
          "text": "is the community pool open yet for the season"
        },
        {
          "mine": false,
          "text": "opens next weekend i think"
        },
        {
          "mine": true,
          "text": "kids are gonna be thrilled"
        },
        {
          "mine": false,
          "text": "mine already asking every day lol"
        }
      ]
    },
    {
      "name": "Sally",
      "messages": [
        {
          "mine": false,
          "text": "i found the perfect curtains for the living room"
        },
        {
          "mine": true,
          "text": "ooh what color"
        },
        {
          "mine": false,
          "text": "a soft grey, ill send a pic"
        },
        {
          "mine": true,
          "text": "love it, where from"
        },
        {
          "mine": false,
          "text": "that home store by the mall"
        }
      ]
    },
    {
      "name": "Ian",
      "messages": [
        {
          "mine": true,
          "text": "did you finish that report for tomorrow"
        },
        {
          "mine": false,
          "text": "almost, just the last section"
        },
        {
          "mine": true,
          "text": "want me to look it over"
        },
        {
          "mine": false,
          "text": "yeah that'd help, ill send it in an hour"
        },
        {
          "mine": true,
          "text": "cool no rush"
        }
      ]
    },
    {
      "name": "Molly",
      "messages": [
        {
          "mine": false,
          "text": "the puppy chewed my shoe again ugh"
        },
        {
          "mine": true,
          "text": "lol which one this time"
        },
        {
          "mine": false,
          "text": "my good sneaker of course"
        },
        {
          "mine": true,
          "text": "get him some chew toys, worked for us"
        },
        {
          "mine": false,
          "text": "ordering some now"
        }
      ]
    },
    {
      "name": "Derek",
      "messages": [
        {
          "mine": true,
          "text": "you free to help me paint the spare room?"
        },
        {
          "mine": false,
          "text": "yeah when were you thinking"
        },
        {
          "mine": true,
          "text": "saturday, should take a few hours"
        },
        {
          "mine": false,
          "text": "ill bring my roller"
        },
        {
          "mine": true,
          "text": "perfect, pizza on me after"
        }
      ]
    },
    {
      "name": "Louise",
      "messages": [
        {
          "mine": false,
          "text": "the dentist moved my appointment to 3pm"
        },
        {
          "mine": true,
          "text": "ok noted, still need a ride?"
        },
        {
          "mine": false,
          "text": "yes please if it isnt trouble"
        },
        {
          "mine": true,
          "text": "not at all, ill grab you at 2:30"
        },
        {
          "mine": false,
          "text": "thank you"
        }
      ]
    },
    {
      "name": "Aaron",
      "messages": [
        {
          "mine": true,
          "text": "whats a good place for cheap tires"
        },
        {
          "mine": false,
          "text": "the shop on elm does good deals"
        },
        {
          "mine": true,
          "text": "cool ill check them out"
        },
        {
          "mine": false,
          "text": "ask for a rotation while youre there its free"
        },
        {
          "mine": true,
          "text": "good tip thanks"
        }
      ]
    },
    {
      "name": "Petra",
      "messages": [
        {
          "mine": false,
          "text": "are you free for a quick call about the potluck"
        },
        {
          "mine": true,
          "text": "yeah give me 5 min"
        },
        {
          "mine": false,
          "text": "cool, just need to sort out who brings what"
        },
        {
          "mine": true,
          "text": "i can do the salad and drinks"
        },
        {
          "mine": false,
          "text": "perfect ill note it down"
        }
      ]
    },
    {
      "name": "Neil",
      "messages": [
        {
          "mine": true,
          "text": "the fridge is making a weird noise again"
        },
        {
          "mine": false,
          "text": "the buzzing one? probably the fan"
        },
        {
          "mine": true,
          "text": "should i call someone"
        },
        {
          "mine": false,
          "text": "try cleaning the coils first, its usually dust"
        },
        {
          "mine": true,
          "text": "ok ill give it a shot"
        }
      ]
    },
    {
      "name": "Gemma",
      "messages": [
        {
          "mine": false,
          "text": "lunch was so good today thanks for the invite"
        },
        {
          "mine": true,
          "text": "anytime! we should make it a weekly thing"
        },
        {
          "mine": false,
          "text": "yes lets do wednesdays"
        },
        {
          "mine": true,
          "text": "deal, wednesday lunch club lol"
        },
        {
          "mine": false,
          "text": "i love it"
        }
      ]
    },
    {
      "name": "Walt",
      "messages": [
        {
          "mine": true,
          "text": "can you water my plants while im gone?"
        },
        {
          "mine": false,
          "text": "sure how often"
        },
        {
          "mine": true,
          "text": "just twice, wednesday and saturday"
        },
        {
          "mine": false,
          "text": "easy, key still under the mat?"
        },
        {
          "mine": true,
          "text": "yep thanks walt"
        }
      ]
    },
    {
      "name": "Bella",
      "messages": [
        {
          "mine": false,
          "text": "i baked way too many cookies again"
        },
        {
          "mine": true,
          "text": "send them my way lol"
        },
        {
          "mine": false,
          "text": "ill drop a plate at your door"
        },
        {
          "mine": true,
          "text": "you spoil us, thank you"
        },
        {
          "mine": false,
          "text": "gotta share the calories haha"
        }
      ]
    },
    {
      "name": "Hugo",
      "messages": [
        {
          "mine": true,
          "text": "is the gym crowded at 6am usually"
        },
        {
          "mine": false,
          "text": "nah pretty empty, best time honestly"
        },
        {
          "mine": true,
          "text": "cool im gonna start going early"
        },
        {
          "mine": false,
          "text": "nice, ill see you there tomorrow"
        }
      ]
    },
    {
      "name": "Tara",
      "messages": [
        {
          "mine": false,
          "text": "my flight got delayed 2 hours ugh"
        },
        {
          "mine": true,
          "text": "oh no, want me to push the pickup?"
        },
        {
          "mine": false,
          "text": "yeah lands at 9 now instead of 7"
        },
        {
          "mine": true,
          "text": "no problem, text me when you land"
        },
        {
          "mine": false,
          "text": "will do, thanks for waiting"
        }
      ]
    },
    {
      "name": "Phil",
      "messages": [
        {
          "mine": true,
          "text": "did the delivery guy leave the couch outside?"
        },
        {
          "mine": false,
          "text": "no i had them bring it in, its in the hall"
        },
        {
          "mine": true,
          "text": "oh perfect thanks for being home"
        },
        {
          "mine": false,
          "text": "np, looks comfy btw"
        }
      ]
    },
    {
      "name": "Vera",
      "messages": [
        {
          "mine": false,
          "text": "the knitting group moved to tuesdays fyi"
        },
        {
          "mine": true,
          "text": "oh good tuesdays work better for me"
        },
        {
          "mine": false,
          "text": "same, and theyre bringing snacks now"
        },
        {
          "mine": true,
          "text": "even better lol"
        },
        {
          "mine": false,
          "text": "see you tuesday then"
        }
      ]
    },
    {
      "name": "Owen",
      "messages": [
        {
          "mine": true,
          "text": "you want the extra concert ticket? mate bailed"
        },
        {
          "mine": false,
          "text": "yes! which night"
        },
        {
          "mine": true,
          "text": "saturday, doors at 7"
        },
        {
          "mine": false,
          "text": "count me in, ill drive"
        },
        {
          "mine": true,
          "text": "awesome, thanks"
        }
      ]
    },
    {
      "name": "Cindy",
      "messages": [
        {
          "mine": false,
          "text": "can you believe how expensive groceries got"
        },
        {
          "mine": true,
          "text": "i know, my bill doubled somehow"
        },
        {
          "mine": false,
          "text": "i started using coupons again lol"
        },
        {
          "mine": true,
          "text": "honestly same, whatever helps"
        },
        {
          "mine": false,
          "text": "we're basically our parents now"
        }
      ]
    },
    {
      "name": "Bruno",
      "messages": [
        {
          "mine": true,
          "text": "the dog park is open again after the storm"
        },
        {
          "mine": false,
          "text": "oh nice, meet there at 5?"
        },
        {
          "mine": true,
          "text": "yeah max needs to run around badly"
        },
        {
          "mine": false,
          "text": "haha same, see you there"
        }
      ]
    }
  ],
  "es": [
    {
      "name": "Mamá",
      "messages": [
        {
          "mine": false,
          "text": "hijo compraste el pan?"
        },
        {
          "mine": true,
          "text": "si ma, y traje leche tambien"
        },
        {
          "mine": false,
          "text": "perfecto gracias. vienes a comer el domingo?"
        },
        {
          "mine": true,
          "text": "claro, a que hora?"
        },
        {
          "mine": false,
          "text": "sobre las 2, viene tu tia tambien"
        },
        {
          "mine": true,
          "text": "vale llevo el postre"
        }
      ]
    },
    {
      "name": "Papá",
      "messages": [
        {
          "mine": true,
          "text": "pa te dejo el coche en el garaje ya"
        },
        {
          "mine": false,
          "text": "vale, le echaste gasolina?"
        },
        {
          "mine": true,
          "text": "si medio deposito"
        },
        {
          "mine": false,
          "text": "gracias. el domingo lo llevo al mecanico"
        },
        {
          "mine": true,
          "text": "vale avisame cuanto sale"
        }
      ]
    },
    {
      "name": "Abuela",
      "messages": [
        {
          "mine": false,
          "text": "cariño cuando vienes a verme"
        },
        {
          "mine": true,
          "text": "esta semana abuela te lo prometo"
        },
        {
          "mine": false,
          "text": "te hago croquetas"
        },
        {
          "mine": true,
          "text": "jajaja las mejores del mundo"
        },
        {
          "mine": false,
          "text": "un beso muy grande"
        },
        {
          "mine": true,
          "text": "otro para ti abuela"
        }
      ]
    },
    {
      "name": "Laura",
      "messages": [
        {
          "mine": true,
          "text": "oye al final quedamos el sabado?"
        },
        {
          "mine": false,
          "text": "si me viene bien por la tarde"
        },
        {
          "mine": true,
          "text": "un cafe sobre las 6?"
        },
        {
          "mine": false,
          "text": "perfecto en el de siempre"
        },
        {
          "mine": true,
          "text": "hecho nos vemos"
        }
      ]
    },
    {
      "name": "Carlos curro",
      "messages": [
        {
          "mine": false,
          "text": "puedes cubrirme el turno del jueves?"
        },
        {
          "mine": true,
          "text": "a que hora entra?"
        },
        {
          "mine": false,
          "text": "a las 9 hasta las 5"
        },
        {
          "mine": true,
          "text": "vale te lo cubro, me debes una"
        },
        {
          "mine": false,
          "text": "gracias crack te invito a algo"
        }
      ]
    },
    {
      "name": "Vecina Marta",
      "messages": [
        {
          "mine": false,
          "text": "hola te llego un paquete lo cogi yo"
        },
        {
          "mine": true,
          "text": "anda gracias! ahora bajo a por el"
        },
        {
          "mine": false,
          "text": "tranqui cuando puedas"
        },
        {
          "mine": true,
          "text": "que majisima eres, mil gracias"
        }
      ]
    },
    {
      "name": "Sergio",
      "messages": [
        {
          "mine": true,
          "text": "tio me dejas el taladro el finde?"
        },
        {
          "mine": false,
          "text": "claro pasate cuando quieras"
        },
        {
          "mine": true,
          "text": "genial el sabado por la mañana"
        },
        {
          "mine": false,
          "text": "ok te lo dejo en la entrada"
        },
        {
          "mine": true,
          "text": "gracias te lo devuelvo el lunes"
        }
      ]
    },
    {
      "name": "Ana",
      "messages": [
        {
          "mine": false,
          "text": "que tal el finde?"
        },
        {
          "mine": true,
          "text": "tranqui, limpiando la casa jaja"
        },
        {
          "mine": false,
          "text": "jajaja yo igual, que aburrimiento"
        },
        {
          "mine": true,
          "text": "tomamos algo mañana y desconectamos?"
        },
        {
          "mine": false,
          "text": "me apunto, a las 7?"
        },
        {
          "mine": true,
          "text": "perfecto"
        }
      ]
    },
    {
      "name": "Dentista",
      "messages": [
        {
          "mine": false,
          "text": "buenos dias, le recordamos su cita el martes a las 10"
        },
        {
          "mine": true,
          "text": "gracias, ahi estare"
        },
        {
          "mine": false,
          "text": "perfecto, no coma nada 1h antes"
        },
        {
          "mine": true,
          "text": "vale anotado"
        }
      ]
    },
    {
      "name": "Javi",
      "messages": [
        {
          "mine": true,
          "text": "vienes al partido el domingo?"
        },
        {
          "mine": false,
          "text": "donde juegan?"
        },
        {
          "mine": true,
          "text": "en el campo de siempre a las 12"
        },
        {
          "mine": false,
          "text": "vale me paso a verte"
        },
        {
          "mine": true,
          "text": "guay luego cañas"
        },
        {
          "mine": false,
          "text": "eso no se discute jaja"
        }
      ]
    },
    {
      "name": "Lucia",
      "messages": [
        {
          "mine": false,
          "text": "me pasas la receta de la tortilla?"
        },
        {
          "mine": true,
          "text": "claro, 4 huevos 3 patatas y cebolla"
        },
        {
          "mine": false,
          "text": "con cebolla siempre eh"
        },
        {
          "mine": true,
          "text": "por supuesto, sin cebolla no es tortilla jaja"
        },
        {
          "mine": false,
          "text": "jajaja gracias guapa"
        }
      ]
    },
    {
      "name": "Tía Pilar",
      "messages": [
        {
          "mine": false,
          "text": "cariño el sabado es el cumple de tu primo"
        },
        {
          "mine": true,
          "text": "anda es verdad, que le regalamos?"
        },
        {
          "mine": false,
          "text": "algo de la play que le gusta"
        },
        {
          "mine": true,
          "text": "vale miro y te digo"
        },
        {
          "mine": false,
          "text": "gracias mi niño"
        }
      ]
    },
    {
      "name": "Roberto mecanico",
      "messages": [
        {
          "mine": true,
          "text": "hola tengo el coche haciendo un ruido raro"
        },
        {
          "mine": false,
          "text": "traelo mañana y lo miro"
        },
        {
          "mine": true,
          "text": "a que hora abres?"
        },
        {
          "mine": false,
          "text": "desde las 8, dejalo y te llamo"
        },
        {
          "mine": true,
          "text": "perfecto gracias"
        }
      ]
    },
    {
      "name": "Grupo del cole (Sara)",
      "messages": [
        {
          "mine": false,
          "text": "mañana los niños salen antes a las 13h"
        },
        {
          "mine": true,
          "text": "gracias por avisar, quien los recoge?"
        },
        {
          "mine": false,
          "text": "yo puedo si quieres"
        },
        {
          "mine": true,
          "text": "te lo agradezco un monton"
        },
        {
          "mine": false,
          "text": "nada mujer para eso estamos"
        }
      ]
    },
    {
      "name": "David",
      "messages": [
        {
          "mine": true,
          "text": "me acercas mañana al aeropuerto?"
        },
        {
          "mine": false,
          "text": "a que hora sale tu vuelo?"
        },
        {
          "mine": true,
          "text": "a las 10, salimos sobre las 8?"
        },
        {
          "mine": false,
          "text": "vale paso a por ti a las 8"
        },
        {
          "mine": true,
          "text": "eres el mejor gracias"
        }
      ]
    },
    {
      "name": "Cristina",
      "messages": [
        {
          "mine": false,
          "text": "al final compraste las cortinas?"
        },
        {
          "mine": true,
          "text": "si las azules quedaron genial"
        },
        {
          "mine": false,
          "text": "que bien, mandame foto"
        },
        {
          "mine": true,
          "text": "luego te la paso que estoy currando"
        },
        {
          "mine": false,
          "text": "vale sin prisa"
        }
      ]
    },
    {
      "name": "Pedro",
      "messages": [
        {
          "mine": true,
          "text": "llego 10 min tarde perdona"
        },
        {
          "mine": false,
          "text": "tranqui yo tambien voy justo"
        },
        {
          "mine": true,
          "text": "vale nos vemos alli"
        },
        {
          "mine": false,
          "text": "pido mesa mientras"
        }
      ]
    },
    {
      "name": "Peluqueria Lola",
      "messages": [
        {
          "mine": true,
          "text": "hola quiero pedir cita para corte"
        },
        {
          "mine": false,
          "text": "hola! tienes el jueves a las 17h"
        },
        {
          "mine": true,
          "text": "perfecto me viene bien"
        },
        {
          "mine": false,
          "text": "genial te apunto, un saludo"
        },
        {
          "mine": true,
          "text": "gracias hasta el jueves"
        }
      ]
    },
    {
      "name": "Miguel",
      "messages": [
        {
          "mine": false,
          "text": "oye me devuelves el libro que te preste?"
        },
        {
          "mine": true,
          "text": "ay si perdona se me olvido"
        },
        {
          "mine": true,
          "text": "te lo llevo mañana al curro"
        },
        {
          "mine": false,
          "text": "vale sin problema"
        },
        {
          "mine": false,
          "text": "que tal estaba?"
        },
        {
          "mine": true,
          "text": "buenisimo me lo lei en 2 dias"
        }
      ]
    },
    {
      "name": "Elena",
      "messages": [
        {
          "mine": true,
          "text": "llueve un monton no salgas sin paraguas"
        },
        {
          "mine": false,
          "text": "buff ya lo he visto, menudo dia"
        },
        {
          "mine": true,
          "text": "si dijeron sol y mira"
        },
        {
          "mine": false,
          "text": "nunca aciertan jaja"
        },
        {
          "mine": true,
          "text": "total"
        }
      ]
    },
    {
      "name": "Hermano Alex",
      "messages": [
        {
          "mine": false,
          "text": "me prestas 20 euros hasta el viernes?"
        },
        {
          "mine": true,
          "text": "si te los paso ahora"
        },
        {
          "mine": false,
          "text": "gracias crack te los devuelvo fijo"
        },
        {
          "mine": true,
          "text": "tranqui no hay prisa"
        },
        {
          "mine": false,
          "text": "eres el mejor hermano"
        },
        {
          "mine": true,
          "text": "jaja lo se"
        }
      ]
    },
    {
      "name": "Raquel",
      "messages": [
        {
          "mine": true,
          "text": "has visto que abrieron una cafeteria nueva?"
        },
        {
          "mine": false,
          "text": "si tiene muy buena pinta"
        },
        {
          "mine": true,
          "text": "vamos a probarla el finde?"
        },
        {
          "mine": false,
          "text": "venga el sabado a media mañana"
        },
        {
          "mine": true,
          "text": "hecho"
        }
      ]
    },
    {
      "name": "Fontanero Juan",
      "messages": [
        {
          "mine": true,
          "text": "hola tengo una fuga en el baño"
        },
        {
          "mine": false,
          "text": "puedo pasarme mañana por la tarde"
        },
        {
          "mine": true,
          "text": "a partir de que hora?"
        },
        {
          "mine": false,
          "text": "sobre las 5 le va bien?"
        },
        {
          "mine": true,
          "text": "perfecto le espero, gracias"
        }
      ]
    },
    {
      "name": "Nuria",
      "messages": [
        {
          "mine": false,
          "text": "te apuntas a yoga el lunes?"
        },
        {
          "mine": true,
          "text": "uff no se, estoy muy vaga"
        },
        {
          "mine": false,
          "text": "venga que te sienta bien"
        },
        {
          "mine": true,
          "text": "vale me convences, a que hora?"
        },
        {
          "mine": false,
          "text": "a las 19h, te espero"
        },
        {
          "mine": true,
          "text": "alli estare"
        }
      ]
    },
    {
      "name": "Grupo padres futbol",
      "messages": [
        {
          "mine": false,
          "text": "quien lleva a los niños al entreno el sabado?"
        },
        {
          "mine": true,
          "text": "yo puedo llevar a 3 en mi coche"
        },
        {
          "mine": false,
          "text": "genial yo recojo a la vuelta"
        },
        {
          "mine": true,
          "text": "perfecto asi nos organizamos"
        },
        {
          "mine": false,
          "text": "gracias equipo"
        }
      ]
    },
    {
      "name": "Sofia",
      "messages": [
        {
          "mine": true,
          "text": "feliz cumple guapa!!! que lo pases genial"
        },
        {
          "mine": false,
          "text": "ay muchas graciasss"
        },
        {
          "mine": true,
          "text": "lo celebramos este finde?"
        },
        {
          "mine": false,
          "text": "si porfa, cena el sabado?"
        },
        {
          "mine": true,
          "text": "me encanta, reservo yo"
        }
      ]
    },
    {
      "name": "Andres",
      "messages": [
        {
          "mine": false,
          "text": "al final que hacemos con la reunion?"
        },
        {
          "mine": true,
          "text": "la movemos al miercoles mejor"
        },
        {
          "mine": false,
          "text": "vale a las 11 te va bien?"
        },
        {
          "mine": true,
          "text": "perfecto reservo la sala"
        },
        {
          "mine": false,
          "text": "genial gracias"
        }
      ]
    },
    {
      "name": "Vecino Antonio",
      "messages": [
        {
          "mine": false,
          "text": "perdona el ruido de anoche estabamos montando un mueble"
        },
        {
          "mine": true,
          "text": "tranquilo no se oyo casi nada"
        },
        {
          "mine": false,
          "text": "menos mal, gracias por la paciencia"
        },
        {
          "mine": true,
          "text": "nada hombre, cualquier cosa avisa"
        }
      ]
    },
    {
      "name": "Marta prima",
      "messages": [
        {
          "mine": true,
          "text": "vienes a la comida familiar del domingo?"
        },
        {
          "mine": false,
          "text": "si llevo yo la ensalada"
        },
        {
          "mine": true,
          "text": "genial yo hago la paella"
        },
        {
          "mine": false,
          "text": "que rica, muero de hambre ya jaja"
        },
        {
          "mine": true,
          "text": "jajaja quedan 3 dias aguanta"
        }
      ]
    },
    {
      "name": "Isabel",
      "messages": [
        {
          "mine": false,
          "text": "me recomiendas un buen dentista?"
        },
        {
          "mine": true,
          "text": "si al que voy yo es muy majo"
        },
        {
          "mine": false,
          "text": "pasame el contacto porfa"
        },
        {
          "mine": true,
          "text": "ahora te lo mando"
        },
        {
          "mine": false,
          "text": "gracias mil"
        }
      ]
    },
    {
      "name": "Toni",
      "messages": [
        {
          "mine": true,
          "text": "tienes plan esta noche?"
        },
        {
          "mine": false,
          "text": "no que tenias pensado?"
        },
        {
          "mine": true,
          "text": "unas pizzas y peli en casa"
        },
        {
          "mine": false,
          "text": "me apunto llevo yo las bebidas"
        },
        {
          "mine": true,
          "text": "guay a las 9 en mi casa"
        },
        {
          "mine": false,
          "text": "alli estoy"
        }
      ]
    },
    {
      "name": "Óptica",
      "messages": [
        {
          "mine": false,
          "text": "buenas tardes sus gafas ya estan listas"
        },
        {
          "mine": true,
          "text": "genial cuando puedo pasar?"
        },
        {
          "mine": false,
          "text": "cualquier dia en horario de tienda"
        },
        {
          "mine": true,
          "text": "paso mañana entonces gracias"
        }
      ]
    },
    {
      "name": "Rosa",
      "messages": [
        {
          "mine": true,
          "text": "que tal la mudanza?"
        },
        {
          "mine": false,
          "text": "agotador pero ya casi acabamos"
        },
        {
          "mine": true,
          "text": "necesitas ayuda con algo?"
        },
        {
          "mine": false,
          "text": "si mañana montamos armarios"
        },
        {
          "mine": true,
          "text": "me paso a echar una mano"
        },
        {
          "mine": false,
          "text": "eres un sol gracias"
        }
      ]
    },
    {
      "name": "Guille",
      "messages": [
        {
          "mine": false,
          "text": "has recogido a los peques del cole?"
        },
        {
          "mine": true,
          "text": "si ya estamos en casa merendando"
        },
        {
          "mine": false,
          "text": "perfecto llego en media hora"
        },
        {
          "mine": true,
          "text": "vale les pongo el baño mientras"
        },
        {
          "mine": false,
          "text": "gracias amor"
        }
      ]
    },
    {
      "name": "Paula",
      "messages": [
        {
          "mine": true,
          "text": "me gusta mucho tu nuevo peinado"
        },
        {
          "mine": false,
          "text": "ay gracias me lo corte ayer"
        },
        {
          "mine": true,
          "text": "pues te queda genial"
        },
        {
          "mine": false,
          "text": "que maja jaja gracias"
        }
      ]
    },
    {
      "name": "Jefe Ramon",
      "messages": [
        {
          "mine": false,
          "text": "puedes enviarme el informe antes de las 12?"
        },
        {
          "mine": true,
          "text": "si lo tengo casi listo"
        },
        {
          "mine": false,
          "text": "perfecto sin prisa hasta esa hora"
        },
        {
          "mine": true,
          "text": "en 20 min te lo mando"
        },
        {
          "mine": false,
          "text": "gracias"
        }
      ]
    },
    {
      "name": "Clara",
      "messages": [
        {
          "mine": false,
          "text": "que verduras compro para la cena?"
        },
        {
          "mine": true,
          "text": "calabacin y pimiento para el salteado"
        },
        {
          "mine": false,
          "text": "vale y algo de proteina?"
        },
        {
          "mine": true,
          "text": "coge pollo que hay oferta"
        },
        {
          "mine": false,
          "text": "perfecto ahora paso por el super"
        }
      ]
    },
    {
      "name": "Fran",
      "messages": [
        {
          "mine": true,
          "text": "al final te compraste la bici?"
        },
        {
          "mine": false,
          "text": "si una de segunda mano, chollo"
        },
        {
          "mine": true,
          "text": "que bien, salimos a rodar el domingo?"
        },
        {
          "mine": false,
          "text": "venga por la mañana temprano"
        },
        {
          "mine": true,
          "text": "a las 9 en el parque"
        },
        {
          "mine": false,
          "text": "hecho"
        }
      ]
    },
    {
      "name": "Veterinario",
      "messages": [
        {
          "mine": true,
          "text": "hola el perro tiene cita para la vacuna?"
        },
        {
          "mine": false,
          "text": "si el jueves a las 18h"
        },
        {
          "mine": true,
          "text": "perfecto lo llevo ayunas?"
        },
        {
          "mine": false,
          "text": "no hace falta, comida normal"
        },
        {
          "mine": true,
          "text": "vale gracias"
        }
      ]
    },
    {
      "name": "Beatriz",
      "messages": [
        {
          "mine": false,
          "text": "vas a ir a comprar al mercado?"
        },
        {
          "mine": true,
          "text": "si ahora voy necesitas algo?"
        },
        {
          "mine": false,
          "text": "traeme fruta si ves buena"
        },
        {
          "mine": true,
          "text": "vale naranjas y platanos?"
        },
        {
          "mine": false,
          "text": "perfecto te lo pago luego"
        },
        {
          "mine": true,
          "text": "tranqui"
        }
      ]
    },
    {
      "name": "Hugo",
      "messages": [
        {
          "mine": true,
          "text": "tio se me ha estropeado la lavadora"
        },
        {
          "mine": false,
          "text": "vaya, has mirado el filtro?"
        },
        {
          "mine": true,
          "text": "no, como se hace?"
        },
        {
          "mine": false,
          "text": "me paso mañana y lo vemos"
        },
        {
          "mine": true,
          "text": "gracias crack te debo una"
        }
      ]
    },
    {
      "name": "Silvia",
      "messages": [
        {
          "mine": false,
          "text": "quedamos para pasear a los perros?"
        },
        {
          "mine": true,
          "text": "si en el parque de siempre"
        },
        {
          "mine": false,
          "text": "a las 6 te va bien?"
        },
        {
          "mine": true,
          "text": "perfecto llevo agua para los dos"
        },
        {
          "mine": false,
          "text": "genial hasta luego"
        }
      ]
    },
    {
      "name": "Óscar",
      "messages": [
        {
          "mine": true,
          "text": "me pasas la lista de la compra?"
        },
        {
          "mine": false,
          "text": "leche huevos pan y detergente"
        },
        {
          "mine": true,
          "text": "algo mas?"
        },
        {
          "mine": false,
          "text": "ah y papel de cocina"
        },
        {
          "mine": true,
          "text": "vale voy ahora"
        }
      ]
    },
    {
      "name": "Tía Merche",
      "messages": [
        {
          "mine": false,
          "text": "hijo me arreglas el movil que no me va el wifi"
        },
        {
          "mine": true,
          "text": "claro tia me paso el finde"
        },
        {
          "mine": false,
          "text": "gracias que no entiendo nada de esto"
        },
        {
          "mine": true,
          "text": "jaja tranqui lo vemos juntos"
        },
        {
          "mine": false,
          "text": "un beso mi niño"
        }
      ]
    },
    {
      "name": "Gonzalo",
      "messages": [
        {
          "mine": true,
          "text": "como va el proyecto?"
        },
        {
          "mine": false,
          "text": "lento pero avanzando"
        },
        {
          "mine": true,
          "text": "necesitas que revise algo?"
        },
        {
          "mine": false,
          "text": "si mañana te paso los documentos"
        },
        {
          "mine": true,
          "text": "perfecto los miro"
        }
      ]
    },
    {
      "name": "Carmen",
      "messages": [
        {
          "mine": false,
          "text": "has visto el tiempo para el finde?"
        },
        {
          "mine": true,
          "text": "si dicen sol todo el fin de semana"
        },
        {
          "mine": false,
          "text": "que bien, vamos a la playa?"
        },
        {
          "mine": true,
          "text": "me apunto salimos temprano"
        },
        {
          "mine": false,
          "text": "a las 9 paso a por ti"
        }
      ]
    },
    {
      "name": "Diego",
      "messages": [
        {
          "mine": true,
          "text": "me firmas el papel del cole de los niños?"
        },
        {
          "mine": false,
          "text": "si dejalo en la mesa que lo firmo"
        },
        {
          "mine": true,
          "text": "gracias hay que entregarlo mañana"
        },
        {
          "mine": false,
          "text": "tranqui lo firmo esta noche"
        },
        {
          "mine": true,
          "text": "perfecto"
        }
      ]
    },
    {
      "name": "Yolanda",
      "messages": [
        {
          "mine": false,
          "text": "te acuerdas del nombre de esa serie?"
        },
        {
          "mine": true,
          "text": "la de los detectives? si ahora te digo"
        },
        {
          "mine": true,
          "text": "se llamaba como el pueblo, ya la busco"
        },
        {
          "mine": false,
          "text": "jaja gracias que me estaba volviendo loca"
        },
        {
          "mine": true,
          "text": "ya la encontre te la paso"
        }
      ]
    },
    {
      "name": "Manolo del bar",
      "messages": [
        {
          "mine": false,
          "text": "os guardo la mesa de siempre para el domingo?"
        },
        {
          "mine": true,
          "text": "si porfa seremos 6"
        },
        {
          "mine": false,
          "text": "perfecto a que hora?"
        },
        {
          "mine": true,
          "text": "sobre las 2 y media"
        },
        {
          "mine": false,
          "text": "apuntado, un saludo"
        }
      ]
    },
    {
      "name": "Natalia",
      "messages": [
        {
          "mine": true,
          "text": "al final que ropa te pones mañana?"
        },
        {
          "mine": false,
          "text": "no se, algo comodo"
        },
        {
          "mine": true,
          "text": "es informal asi que tranqui"
        },
        {
          "mine": false,
          "text": "menos mal, vaqueros entonces"
        },
        {
          "mine": true,
          "text": "perfecto yo igual"
        }
      ]
    },
    {
      "name": "Ismael",
      "messages": [
        {
          "mine": false,
          "text": "me ayudas a mover el sofa el sabado?"
        },
        {
          "mine": true,
          "text": "claro por la mañana?"
        },
        {
          "mine": false,
          "text": "si sobre las 11"
        },
        {
          "mine": true,
          "text": "alli estoy, pesa mucho?"
        },
        {
          "mine": false,
          "text": "un poco pero entre dos facil"
        },
        {
          "mine": true,
          "text": "venga sin problema"
        }
      ]
    },
    {
      "name": "Alba",
      "messages": [
        {
          "mine": true,
          "text": "que tal durmio la peque anoche?"
        },
        {
          "mine": false,
          "text": "regular, se desperto un par de veces"
        },
        {
          "mine": true,
          "text": "vaya, estaras agotada"
        },
        {
          "mine": false,
          "text": "un poco pero bien"
        },
        {
          "mine": true,
          "text": "si necesitas algo me dices"
        },
        {
          "mine": false,
          "text": "gracias guapa"
        }
      ]
    },
    {
      "name": "Ruben",
      "messages": [
        {
          "mine": false,
          "text": "cae partido esta noche?"
        },
        {
          "mine": true,
          "text": "claro, en mi casa a las 9"
        },
        {
          "mine": false,
          "text": "llevo cervezas y patatas"
        },
        {
          "mine": true,
          "text": "perfecto asi vemos el partidazo"
        },
        {
          "mine": false,
          "text": "eso espero jaja"
        }
      ]
    },
    {
      "name": "Inma",
      "messages": [
        {
          "mine": true,
          "text": "has probado la nueva panaderia?"
        },
        {
          "mine": false,
          "text": "no, es buena?"
        },
        {
          "mine": true,
          "text": "el pan esta buenisimo y no es caro"
        },
        {
          "mine": false,
          "text": "me paso mañana entonces"
        },
        {
          "mine": true,
          "text": "prueba las napolitanas"
        }
      ]
    },
    {
      "name": "Gestor Luis",
      "messages": [
        {
          "mine": false,
          "text": "buenas necesito que me firme unos papeles"
        },
        {
          "mine": true,
          "text": "claro cuando paso?"
        },
        {
          "mine": false,
          "text": "esta semana cualquier tarde"
        },
        {
          "mine": true,
          "text": "voy el miercoles entonces"
        },
        {
          "mine": false,
          "text": "perfecto le espero"
        }
      ]
    },
    {
      "name": "Marina",
      "messages": [
        {
          "mine": true,
          "text": "vamos al cine el viernes?"
        },
        {
          "mine": false,
          "text": "si que estrenan?"
        },
        {
          "mine": true,
          "text": "la de animacion que querias ver"
        },
        {
          "mine": false,
          "text": "genial sesion de las 8?"
        },
        {
          "mine": true,
          "text": "saco las entradas ya"
        }
      ]
    },
    {
      "name": "Vecina Rosa",
      "messages": [
        {
          "mine": false,
          "text": "me riegas las plantas este finde? me voy fuera"
        },
        {
          "mine": true,
          "text": "claro dejame la llave"
        },
        {
          "mine": false,
          "text": "gracias te la dejo debajo del felpudo"
        },
        {
          "mine": true,
          "text": "perfecto tu tranquila"
        },
        {
          "mine": false,
          "text": "eres un cielo"
        }
      ]
    },
    {
      "name": "Alberto",
      "messages": [
        {
          "mine": true,
          "text": "al final montaste la estanteria?"
        },
        {
          "mine": false,
          "text": "si pero me sobraron tornillos jaja"
        },
        {
          "mine": true,
          "text": "jajaja lo tipico"
        },
        {
          "mine": false,
          "text": "aguanta bien asi que da igual"
        },
        {
          "mine": true,
          "text": "mientras no se caiga"
        }
      ]
    },
    {
      "name": "Verónica",
      "messages": [
        {
          "mine": false,
          "text": "te apuntas a la excursion del sabado?"
        },
        {
          "mine": true,
          "text": "donde vais?"
        },
        {
          "mine": false,
          "text": "a la sierra a hacer senderismo"
        },
        {
          "mine": true,
          "text": "me apunto, llevo bocadillos"
        },
        {
          "mine": false,
          "text": "genial salimos a las 8"
        },
        {
          "mine": true,
          "text": "puntual estare"
        }
      ]
    },
    {
      "name": "Emilio",
      "messages": [
        {
          "mine": true,
          "text": "me prestas el cargador que olvide el mio?"
        },
        {
          "mine": false,
          "text": "claro tengo uno de sobra"
        },
        {
          "mine": true,
          "text": "gracias te lo devuelvo mañana"
        },
        {
          "mine": false,
          "text": "tranqui quedatelo tengo dos"
        },
        {
          "mine": true,
          "text": "anda gracias"
        }
      ]
    },
    {
      "name": "Patricia",
      "messages": [
        {
          "mine": false,
          "text": "que hacemos para la cena de nochevieja?"
        },
        {
          "mine": true,
          "text": "uf falta mucho pero podemos ir pensando"
        },
        {
          "mine": false,
          "text": "jaja tienes razon, marisco?"
        },
        {
          "mine": true,
          "text": "me encanta la idea"
        },
        {
          "mine": false,
          "text": "pues vamos apuntando"
        }
      ]
    },
    {
      "name": "Kike",
      "messages": [
        {
          "mine": true,
          "text": "tio se me pincho la rueda"
        },
        {
          "mine": false,
          "text": "donde estas? voy a ayudarte"
        },
        {
          "mine": true,
          "text": "en el parking del super"
        },
        {
          "mine": false,
          "text": "llego en 10 min con el gato"
        },
        {
          "mine": true,
          "text": "eres el mejor gracias"
        }
      ]
    },
    {
      "name": "Lorena",
      "messages": [
        {
          "mine": false,
          "text": "has hecho la reserva del restaurante?"
        },
        {
          "mine": true,
          "text": "si para el sabado a las 9"
        },
        {
          "mine": false,
          "text": "perfecto cuantos somos?"
        },
        {
          "mine": true,
          "text": "al final 5"
        },
        {
          "mine": false,
          "text": "genial, tengo ganas"
        }
      ]
    },
    {
      "name": "Abuelo",
      "messages": [
        {
          "mine": false,
          "text": "cuando vienes a jugar al domino?"
        },
        {
          "mine": true,
          "text": "el domingo abuelo, preparate"
        },
        {
          "mine": false,
          "text": "jajaja te voy a ganar"
        },
        {
          "mine": true,
          "text": "eso ya lo veremos"
        },
        {
          "mine": false,
          "text": "trae a tu hermano tambien"
        },
        {
          "mine": true,
          "text": "le digo, un abrazo"
        }
      ]
    },
    {
      "name": "Mónica",
      "messages": [
        {
          "mine": true,
          "text": "me acompañas a mirar zapatos?"
        },
        {
          "mine": false,
          "text": "si cuando quieres ir?"
        },
        {
          "mine": true,
          "text": "mañana por la tarde"
        },
        {
          "mine": false,
          "text": "vale sobre las 5 en el centro"
        },
        {
          "mine": true,
          "text": "perfecto nos vemos alli"
        }
      ]
    },
    {
      "name": "Julio",
      "messages": [
        {
          "mine": false,
          "text": "sabes si mañana hay mercadillo?"
        },
        {
          "mine": true,
          "text": "si los martes siempre ponen"
        },
        {
          "mine": false,
          "text": "genial voy a por verduras"
        },
        {
          "mine": true,
          "text": "trae unos tomates que estan de temporada"
        },
        {
          "mine": false,
          "text": "apuntado"
        }
      ]
    },
    {
      "name": "Eva",
      "messages": [
        {
          "mine": true,
          "text": "que tal la clase de cocina?"
        },
        {
          "mine": false,
          "text": "genial aprendi a hacer risotto"
        },
        {
          "mine": true,
          "text": "que envidia, me invitas a probarlo?"
        },
        {
          "mine": false,
          "text": "claro ven el domingo"
        },
        {
          "mine": true,
          "text": "alli estare con hambre"
        },
        {
          "mine": false,
          "text": "jajaja te espero"
        }
      ]
    },
    {
      "name": "Portero Paco",
      "messages": [
        {
          "mine": false,
          "text": "buenas, mañana viene el de la caldera"
        },
        {
          "mine": true,
          "text": "a que hora mas o menos?"
        },
        {
          "mine": false,
          "text": "entre 10 y 12 dijo"
        },
        {
          "mine": true,
          "text": "vale me quedo en casa gracias"
        },
        {
          "mine": false,
          "text": "nada, un saludo"
        }
      ]
    },
    {
      "name": "Adrián",
      "messages": [
        {
          "mine": true,
          "text": "has visto mi sudadera gris?"
        },
        {
          "mine": false,
          "text": "creo que la dejaste en mi casa"
        },
        {
          "mine": true,
          "text": "ah verdad, me la traes?"
        },
        {
          "mine": false,
          "text": "si mañana te la llevo"
        },
        {
          "mine": true,
          "text": "gracias"
        }
      ]
    },
    {
      "name": "Teresa",
      "messages": [
        {
          "mine": false,
          "text": "vas a la reunion de vecinos el jueves?"
        },
        {
          "mine": true,
          "text": "si a las 7 no?"
        },
        {
          "mine": false,
          "text": "eso es, hay que hablar del ascensor"
        },
        {
          "mine": true,
          "text": "uf otra vez el tema"
        },
        {
          "mine": false,
          "text": "ya ves, alli nos vemos"
        }
      ]
    },
    {
      "name": "Nacho",
      "messages": [
        {
          "mine": true,
          "text": "quedamos a estudiar en la biblio?"
        },
        {
          "mine": false,
          "text": "si mañana por la tarde"
        },
        {
          "mine": true,
          "text": "a las 4 te va bien?"
        },
        {
          "mine": false,
          "text": "perfecto llevo yo los apuntes"
        },
        {
          "mine": true,
          "text": "genial gracias"
        }
      ]
    },
    {
      "name": "Bea del gym",
      "messages": [
        {
          "mine": false,
          "text": "vienes a la clase de spinning?"
        },
        {
          "mine": true,
          "text": "hoy no puedo, mañana seguro"
        },
        {
          "mine": false,
          "text": "vale te guardo sitio mañana"
        },
        {
          "mine": true,
          "text": "gracias, a las 8 no?"
        },
        {
          "mine": false,
          "text": "eso es"
        }
      ]
    },
    {
      "name": "Ángel",
      "messages": [
        {
          "mine": true,
          "text": "me echas una mano con la mudanza?"
        },
        {
          "mine": false,
          "text": "claro cuando es?"
        },
        {
          "mine": true,
          "text": "el sabado por la mañana"
        },
        {
          "mine": false,
          "text": "cuenta conmigo llevo guantes"
        },
        {
          "mine": true,
          "text": "perfecto, cañas despues"
        },
        {
          "mine": false,
          "text": "eso ni se pregunta"
        }
      ]
    },
    {
      "name": "Susana",
      "messages": [
        {
          "mine": false,
          "text": "que le regalamos a mama por su cumple?"
        },
        {
          "mine": true,
          "text": "habia visto un bolso que le gustaba"
        },
        {
          "mine": false,
          "text": "buena idea, lo pagamos a medias?"
        },
        {
          "mine": true,
          "text": "claro, luego te paso el enlace"
        },
        {
          "mine": false,
          "text": "perfecto gracias hermana"
        }
      ]
    },
    {
      "name": "Marcos",
      "messages": [
        {
          "mine": true,
          "text": "al final vas al concierto?"
        },
        {
          "mine": false,
          "text": "si consegui entrada"
        },
        {
          "mine": true,
          "text": "que bien yo tambien voy"
        },
        {
          "mine": false,
          "text": "genial nos vemos alli entonces"
        },
        {
          "mine": true,
          "text": "quedamos antes a cenar?"
        },
        {
          "mine": false,
          "text": "me parece perfecto"
        }
      ]
    },
    {
      "name": "Amparo",
      "messages": [
        {
          "mine": false,
          "text": "me pasas la receta del gazpacho?"
        },
        {
          "mine": true,
          "text": "claro tomate pepino pimiento ajo y aceite"
        },
        {
          "mine": false,
          "text": "y pan tambien no?"
        },
        {
          "mine": true,
          "text": "si un poco de pan remojado"
        },
        {
          "mine": false,
          "text": "gracias, con este calor apetece"
        }
      ]
    },
    {
      "name": "Iker",
      "messages": [
        {
          "mine": true,
          "text": "vamos a correr mañana?"
        },
        {
          "mine": false,
          "text": "si a que hora?"
        },
        {
          "mine": true,
          "text": "a las 7 antes de que apriete el calor"
        },
        {
          "mine": false,
          "text": "buff temprano pero vale"
        },
        {
          "mine": true,
          "text": "te espero en el parque"
        },
        {
          "mine": false,
          "text": "alli estare medio dormido jaja"
        }
      ]
    },
    {
      "name": "Dolores",
      "messages": [
        {
          "mine": false,
          "text": "cariño me acercas al medico el lunes?"
        },
        {
          "mine": true,
          "text": "claro a que hora es la cita?"
        },
        {
          "mine": false,
          "text": "a las 11"
        },
        {
          "mine": true,
          "text": "paso a por ti a las 10 y media"
        },
        {
          "mine": false,
          "text": "gracias mi vida"
        }
      ]
    },
    {
      "name": "Xavi",
      "messages": [
        {
          "mine": true,
          "text": "has terminado de pintar la habitacion?"
        },
        {
          "mine": false,
          "text": "casi, me falta una pared"
        },
        {
          "mine": true,
          "text": "que color al final?"
        },
        {
          "mine": false,
          "text": "verde claro, quedo muy bien"
        },
        {
          "mine": true,
          "text": "que ganas de verlo"
        }
      ]
    },
    {
      "name": "Noelia",
      "messages": [
        {
          "mine": false,
          "text": "nos vemos para el cafe de las 5?"
        },
        {
          "mine": true,
          "text": "si voy saliendo ya"
        },
        {
          "mine": false,
          "text": "vale pido dos con leche?"
        },
        {
          "mine": true,
          "text": "el mio cortado porfa"
        },
        {
          "mine": false,
          "text": "hecho"
        }
      ]
    },
    {
      "name": "Tío Paco",
      "messages": [
        {
          "mine": false,
          "text": "vienes a la barbacoa del domingo?"
        },
        {
          "mine": true,
          "text": "claro que llevo?"
        },
        {
          "mine": false,
          "text": "trae bebida y algo de postre"
        },
        {
          "mine": true,
          "text": "perfecto llevo tarta"
        },
        {
          "mine": false,
          "text": "genial, empezamos a las 2"
        }
      ]
    },
    {
      "name": "Celia",
      "messages": [
        {
          "mine": true,
          "text": "me guardas sitio en el tren?"
        },
        {
          "mine": false,
          "text": "si estoy en el vagon 4"
        },
        {
          "mine": true,
          "text": "vale voy corriendo"
        },
        {
          "mine": false,
          "text": "tranqui aun no sale"
        },
        {
          "mine": true,
          "text": "uf menos mal"
        }
      ]
    },
    {
      "name": "Gym recepcion",
      "messages": [
        {
          "mine": true,
          "text": "hola cambio mi cuota a mañanas?"
        },
        {
          "mine": false,
          "text": "claro sin problema, desde cuando?"
        },
        {
          "mine": true,
          "text": "desde el mes que viene"
        },
        {
          "mine": false,
          "text": "perfecto ya lo cambio"
        },
        {
          "mine": true,
          "text": "gracias"
        }
      ]
    },
    {
      "name": "Pablo",
      "messages": [
        {
          "mine": false,
          "text": "has recogido el traje de la tintoreria?"
        },
        {
          "mine": true,
          "text": "si esta colgado en el armario"
        },
        {
          "mine": false,
          "text": "genial gracias, lo necesito el viernes"
        },
        {
          "mine": true,
          "text": "esta listo tranquilo"
        },
        {
          "mine": false,
          "text": "perfecto"
        }
      ]
    },
    {
      "name": "Vane",
      "messages": [
        {
          "mine": true,
          "text": "me dejas la receta de las lentejas de tu madre?"
        },
        {
          "mine": false,
          "text": "claro es facil, chorizo y verduras"
        },
        {
          "mine": true,
          "text": "cuanto tiempo de cocina?"
        },
        {
          "mine": false,
          "text": "olla express 20 min"
        },
        {
          "mine": true,
          "text": "perfecto gracias, las hago hoy"
        }
      ]
    },
    {
      "name": "Salva",
      "messages": [
        {
          "mine": false,
          "text": "quedamos para ver el finde donde?"
        },
        {
          "mine": true,
          "text": "en la plaza a las 6?"
        },
        {
          "mine": false,
          "text": "vale y luego cine?"
        },
        {
          "mine": true,
          "text": "me parece bien miramos alli"
        },
        {
          "mine": false,
          "text": "genial"
        }
      ]
    },
    {
      "name": "Maite",
      "messages": [
        {
          "mine": true,
          "text": "como sigue tu madre?"
        },
        {
          "mine": false,
          "text": "mejor gracias, ya sale a pasear"
        },
        {
          "mine": true,
          "text": "cuanto me alegro"
        },
        {
          "mine": false,
          "text": "si nos quedamos mas tranquilos"
        },
        {
          "mine": true,
          "text": "dale recuerdos"
        },
        {
          "mine": false,
          "text": "de tu parte"
        }
      ]
    },
    {
      "name": "Jose Luis",
      "messages": [
        {
          "mine": false,
          "text": "me pasas el numero del electricista?"
        },
        {
          "mine": true,
          "text": "si ahora te lo mando"
        },
        {
          "mine": false,
          "text": "gracias se me fue la luz de la cocina"
        },
        {
          "mine": true,
          "text": "el es muy rapido ya veras"
        },
        {
          "mine": false,
          "text": "genial le llamo"
        }
      ]
    },
    {
      "name": "Rocío",
      "messages": [
        {
          "mine": true,
          "text": "que tal la primera semana de curro?"
        },
        {
          "mine": false,
          "text": "bien aunque con muchas cosas nuevas"
        },
        {
          "mine": true,
          "text": "normal, poco a poco"
        },
        {
          "mine": false,
          "text": "si la gente es maja al menos"
        },
        {
          "mine": true,
          "text": "eso es lo importante"
        }
      ]
    },
    {
      "name": "Dani",
      "messages": [
        {
          "mine": false,
          "text": "tienes plan para el puente?"
        },
        {
          "mine": true,
          "text": "pensaba ir al pueblo"
        },
        {
          "mine": false,
          "text": "que bien, a descansar"
        },
        {
          "mine": true,
          "text": "eso espero, y tu?"
        },
        {
          "mine": false,
          "text": "me quedo por aqui tranquilo"
        }
      ]
    },
    {
      "name": "Sonia",
      "messages": [
        {
          "mine": true,
          "text": "has visto mis llaves?"
        },
        {
          "mine": false,
          "text": "creo que estan en la entrada"
        },
        {
          "mine": true,
          "text": "ah si aqui estan gracias"
        },
        {
          "mine": false,
          "text": "jaja siempre igual"
        },
        {
          "mine": true,
          "text": "lo se soy un desastre"
        }
      ]
    },
    {
      "name": "Óptico Jorge",
      "messages": [
        {
          "mine": false,
          "text": "sus lentillas ya llegaron"
        },
        {
          "mine": true,
          "text": "genial paso a recogerlas hoy"
        },
        {
          "mine": false,
          "text": "perfecto cerramos a las 8"
        },
        {
          "mine": true,
          "text": "llego sobre las 7 gracias"
        }
      ]
    },
    {
      "name": "Irene",
      "messages": [
        {
          "mine": true,
          "text": "vamos a la piscina mañana?"
        },
        {
          "mine": false,
          "text": "si con los niños?"
        },
        {
          "mine": true,
          "text": "claro les encanta"
        },
        {
          "mine": false,
          "text": "perfecto llevo yo la merienda"
        },
        {
          "mine": true,
          "text": "genial a las 11 alli"
        },
        {
          "mine": false,
          "text": "hecho"
        }
      ]
    },
    {
      "name": "Víctor",
      "messages": [
        {
          "mine": false,
          "text": "me ayudas con la declaracion de papeles?"
        },
        {
          "mine": true,
          "text": "claro cuando quieres?"
        },
        {
          "mine": false,
          "text": "el sabado por la mañana"
        },
        {
          "mine": true,
          "text": "vale trae todo lo que tengas"
        },
        {
          "mine": false,
          "text": "perfecto gracias"
        }
      ]
    },
    {
      "name": "Charo",
      "messages": [
        {
          "mine": true,
          "text": "que rico olia tu guiso el otro dia"
        },
        {
          "mine": false,
          "text": "jaja era cocido, te guardo un poco"
        },
        {
          "mine": true,
          "text": "anda que maja gracias"
        },
        {
          "mine": false,
          "text": "paso a dejartelo esta tarde"
        },
        {
          "mine": true,
          "text": "me haces el dia"
        }
      ]
    },
    {
      "name": "Aitor",
      "messages": [
        {
          "mine": false,
          "text": "al final compraste la tele nueva?"
        },
        {
          "mine": true,
          "text": "si estaba de oferta, un chollo"
        },
        {
          "mine": false,
          "text": "que bien, la montaste?"
        },
        {
          "mine": true,
          "text": "si en la pared, se ve genial"
        },
        {
          "mine": false,
          "text": "un dia me paso a verla"
        }
      ]
    },
    {
      "name": "Puri",
      "messages": [
        {
          "mine": true,
          "text": "me guardas media docena de huevos?"
        },
        {
          "mine": false,
          "text": "claro paso mañana con ellos"
        },
        {
          "mine": true,
          "text": "son del corral verdad?"
        },
        {
          "mine": false,
          "text": "si de mis gallinas"
        },
        {
          "mine": true,
          "text": "que ricos, gracias"
        }
      ]
    },
    {
      "name": "Rafa",
      "messages": [
        {
          "mine": false,
          "text": "quieres que te lleve al curro mañana?"
        },
        {
          "mine": true,
          "text": "anda si no te importa"
        },
        {
          "mine": false,
          "text": "para nada, paso a las 8"
        },
        {
          "mine": true,
          "text": "perfecto te espero abajo"
        },
        {
          "mine": false,
          "text": "vale hasta mañana"
        }
      ]
    },
    {
      "name": "Alicia",
      "messages": [
        {
          "mine": true,
          "text": "que tal la peque en el cole hoy?"
        },
        {
          "mine": false,
          "text": "muy contenta, hizo un dibujo precioso"
        },
        {
          "mine": true,
          "text": "que ilusion, me lo enseñas luego?"
        },
        {
          "mine": false,
          "text": "claro lo tiene colgado en la nevera"
        },
        {
          "mine": true,
          "text": "jaja como debe ser"
        }
      ]
    },
    {
      "name": "Chema",
      "messages": [
        {
          "mine": false,
          "text": "nos vemos para la cena del grupo?"
        },
        {
          "mine": true,
          "text": "si donde quedamos?"
        },
        {
          "mine": false,
          "text": "en el italiano de la esquina"
        },
        {
          "mine": true,
          "text": "perfecto reservo yo"
        },
        {
          "mine": false,
          "text": "genial a las 9"
        },
        {
          "mine": true,
          "text": "alli estare"
        }
      ]
    }
  ],
  "fr": [
    {
      "name": "Maman",
      "messages": [
        {
          "mine": false,
          "text": "tu viens dimanche midi? je fais un rôti"
        },
        {
          "mine": true,
          "text": "oui avec plaisir, j'apporte le dessert"
        },
        {
          "mine": false,
          "text": "parfait. ta soeur vient aussi"
        },
        {
          "mine": true,
          "text": "cool ça fait longtemps. je serai là vers 12h30"
        },
        {
          "mine": false,
          "text": "prends une baguette en passant stp"
        },
        {
          "mine": true,
          "text": "ok pas de souci bisous"
        }
      ]
    },
    {
      "name": "Papa",
      "messages": [
        {
          "mine": true,
          "text": "salut papa, la voiture fait un bruit bizarre au freinage"
        },
        {
          "mine": false,
          "text": "c'est peut etre les plaquettes. tu as fait combien de km?"
        },
        {
          "mine": true,
          "text": "presque 40000"
        },
        {
          "mine": false,
          "text": "ah ouais faut vérifier. prends rdv au garage"
        },
        {
          "mine": true,
          "text": "ok je regarde demain merci"
        }
      ]
    },
    {
      "name": "Mamie",
      "messages": [
        {
          "mine": false,
          "text": "bonjour mon chéri tu vas bien?"
        },
        {
          "mine": true,
          "text": "oui mamie et toi? il fait beau chez toi?"
        },
        {
          "mine": false,
          "text": "un peu de vent mais ça va. tu passes cette semaine?"
        },
        {
          "mine": true,
          "text": "je passe jeudi aprem si ça te va"
        },
        {
          "mine": false,
          "text": "super je ferai un gateau"
        },
        {
          "mine": true,
          "text": "miam à jeudi bisous"
        }
      ]
    },
    {
      "name": "Julie",
      "messages": [
        {
          "mine": true,
          "text": "on se voit toujours pour un café demain?"
        },
        {
          "mine": false,
          "text": "oui! 10h au petit bistrot de la place?"
        },
        {
          "mine": true,
          "text": "nickel ça marche"
        },
        {
          "mine": false,
          "text": "j'ai plein de trucs à te raconter"
        },
        {
          "mine": true,
          "text": "haha j'ai hate à demain"
        }
      ]
    },
    {
      "name": "Thomas",
      "messages": [
        {
          "mine": false,
          "text": "tu bosses ce weekend?"
        },
        {
          "mine": true,
          "text": "non je suis libre samedi"
        },
        {
          "mine": false,
          "text": "on va faire une rando du coup?"
        },
        {
          "mine": true,
          "text": "ah oui bonne idée, celle du lac?"
        },
        {
          "mine": false,
          "text": "parfait je prends le pique nique"
        },
        {
          "mine": true,
          "text": "top je conduis"
        }
      ]
    },
    {
      "name": "Léa",
      "messages": [
        {
          "mine": true,
          "text": "coucou tu peux me passer ta recette de tarte aux pommes?"
        },
        {
          "mine": false,
          "text": "oui! 4 pommes, pâte brisée, un peu de cannelle et hop"
        },
        {
          "mine": true,
          "text": "combien de temps au four?"
        },
        {
          "mine": false,
          "text": "35 min à 180"
        },
        {
          "mine": true,
          "text": "merci beaucoup je teste ce soir"
        }
      ]
    },
    {
      "name": "Julien le plombier",
      "messages": [
        {
          "mine": true,
          "text": "bonjour, le robinet de la cuisine fuit encore"
        },
        {
          "mine": false,
          "text": "bonjour, je peux passer mardi matin vers 9h"
        },
        {
          "mine": true,
          "text": "ça me va très bien"
        },
        {
          "mine": false,
          "text": "ok je note. à mardi"
        },
        {
          "mine": true,
          "text": "merci bonne journée"
        }
      ]
    },
    {
      "name": "Nico",
      "messages": [
        {
          "mine": false,
          "text": "match de foot ce soir chez moi tu viens?"
        },
        {
          "mine": true,
          "text": "ça commence à quelle heure?"
        },
        {
          "mine": false,
          "text": "21h, ramène des chips si tu peux"
        },
        {
          "mine": true,
          "text": "ok j'apporte aussi des bières"
        },
        {
          "mine": false,
          "text": "parfait à ce soir"
        }
      ]
    },
    {
      "name": "Sarah",
      "messages": [
        {
          "mine": true,
          "text": "t'as reçu le colis finalement?"
        },
        {
          "mine": false,
          "text": "non toujours pas, il est en retard"
        },
        {
          "mine": true,
          "text": "ah zut, tu as suivi le tracking?"
        },
        {
          "mine": false,
          "text": "oui il est bloqué au centre de tri depuis 3 jours"
        },
        {
          "mine": true,
          "text": "galère. faut les appeler"
        },
        {
          "mine": false,
          "text": "ouais je vais faire ça demain"
        }
      ]
    },
    {
      "name": "Le dentiste",
      "messages": [
        {
          "mine": false,
          "text": "bonjour, rappel de votre rdv jeudi à 14h30"
        },
        {
          "mine": true,
          "text": "bonjour, c'est noté merci"
        },
        {
          "mine": false,
          "text": "pensez à venir 5 min en avance svp"
        },
        {
          "mine": true,
          "text": "pas de souci à jeudi"
        }
      ]
    },
    {
      "name": "Camille",
      "messages": [
        {
          "mine": true,
          "text": "tu fais quoi ce midi?"
        },
        {
          "mine": false,
          "text": "rien de prévu, tu veux manger un truc?"
        },
        {
          "mine": true,
          "text": "oui un sandwich au parc?"
        },
        {
          "mine": false,
          "text": "ça marche, à 12h30 devant l'entrée"
        },
        {
          "mine": true,
          "text": "super à toute"
        }
      ]
    },
    {
      "name": "Grand frère",
      "messages": [
        {
          "mine": false,
          "text": "tu peux garder les enfants samedi soir?"
        },
        {
          "mine": true,
          "text": "oui pas de souci, à quelle heure?"
        },
        {
          "mine": false,
          "text": "on dépose vers 19h, on rentre pas trop tard"
        },
        {
          "mine": true,
          "text": "nickel je commande une pizza pour eux"
        },
        {
          "mine": false,
          "text": "t'es un chef merci"
        },
        {
          "mine": true,
          "text": "de rien c'est un plaisir"
        }
      ]
    },
    {
      "name": "Manon",
      "messages": [
        {
          "mine": true,
          "text": "tu as pensé à ramener mon parapluie?"
        },
        {
          "mine": false,
          "text": "ah mince je l'ai oublié désolée"
        },
        {
          "mine": true,
          "text": "pas grave tu me le rends quand tu peux"
        },
        {
          "mine": false,
          "text": "je te l'apporte demain au boulot promis"
        },
        {
          "mine": true,
          "text": "merci t'inquiète"
        }
      ]
    },
    {
      "name": "Kévin",
      "messages": [
        {
          "mine": false,
          "text": "il pleut des cordes ici, chez toi?"
        },
        {
          "mine": true,
          "text": "ouais c'est le déluge, j'ai zappé le parapluie"
        },
        {
          "mine": false,
          "text": "haha courage, ça se calme cet aprem parait il"
        },
        {
          "mine": true,
          "text": "j'espère j'ai les pieds trempés"
        },
        {
          "mine": false,
          "text": "prends un thé bien chaud"
        }
      ]
    },
    {
      "name": "Coiffeur",
      "messages": [
        {
          "mine": true,
          "text": "bonjour, je voudrais un rdv pour une coupe cette semaine"
        },
        {
          "mine": false,
          "text": "bonjour, vendredi 16h ça vous convient?"
        },
        {
          "mine": true,
          "text": "parfait vendredi 16h"
        },
        {
          "mine": false,
          "text": "c'est réservé, à vendredi"
        },
        {
          "mine": true,
          "text": "merci beaucoup"
        }
      ]
    },
    {
      "name": "Émilie",
      "messages": [
        {
          "mine": true,
          "text": "les enfants ont piscine demain c'est bien ça?"
        },
        {
          "mine": false,
          "text": "oui à 17h, tu peux les emmener?"
        },
        {
          "mine": true,
          "text": "oui je m'en occupe, tu récupères?"
        },
        {
          "mine": false,
          "text": "ouais je sors du boulot à 18h pile"
        },
        {
          "mine": true,
          "text": "parfait on se relaie"
        }
      ]
    },
    {
      "name": "Antoine",
      "messages": [
        {
          "mine": false,
          "text": "tu me prêtes ta perceuse ce weekend?"
        },
        {
          "mine": true,
          "text": "oui bien sur, tu montes un meuble?"
        },
        {
          "mine": false,
          "text": "ouais une étagère ikea, la galère"
        },
        {
          "mine": true,
          "text": "haha classique. passe la prendre quand tu veux"
        },
        {
          "mine": false,
          "text": "je passe samedi matin merci mec"
        }
      ]
    },
    {
      "name": "Chloé",
      "messages": [
        {
          "mine": true,
          "text": "on fait les courses ensemble demain?"
        },
        {
          "mine": false,
          "text": "oui bonne idée, on va au marché?"
        },
        {
          "mine": true,
          "text": "oui les légumes sont meilleurs là bas"
        },
        {
          "mine": false,
          "text": "rdv 9h à l'entrée?"
        },
        {
          "mine": true,
          "text": "parfait à demain"
        }
      ]
    },
    {
      "name": "Vétérinaire",
      "messages": [
        {
          "mine": false,
          "text": "bonjour, rappel vaccin du chat la semaine prochaine"
        },
        {
          "mine": true,
          "text": "ah oui merci, je peux venir lundi?"
        },
        {
          "mine": false,
          "text": "lundi 11h il reste un créneau"
        },
        {
          "mine": true,
          "text": "c'est parfait je le prends"
        },
        {
          "mine": false,
          "text": "très bien à lundi"
        }
      ]
    },
    {
      "name": "Maxime",
      "messages": [
        {
          "mine": false,
          "text": "tu peux me déposer à la gare demain matin?"
        },
        {
          "mine": true,
          "text": "oui ton train est à quelle heure?"
        },
        {
          "mine": false,
          "text": "8h12, faut partir vers 7h45"
        },
        {
          "mine": true,
          "text": "ok je passe te chercher à 7h40"
        },
        {
          "mine": false,
          "text": "super merci beaucoup"
        }
      ]
    },
    {
      "name": "Tata Sylvie",
      "messages": [
        {
          "mine": false,
          "text": "joyeux anniversaire mon grand! passe une belle journée"
        },
        {
          "mine": true,
          "text": "merci tata ça me touche"
        },
        {
          "mine": false,
          "text": "on fête ça bientot j'espère"
        },
        {
          "mine": true,
          "text": "oui viens dimanche prochain à la maison"
        },
        {
          "mine": false,
          "text": "avec plaisir je ramène un gateau"
        }
      ]
    },
    {
      "name": "Romain",
      "messages": [
        {
          "mine": true,
          "text": "tu es dispo pour la réunion à 15h?"
        },
        {
          "mine": false,
          "text": "oui j'y serai, salle B?"
        },
        {
          "mine": true,
          "text": "non finalement salle C, la B est prise"
        },
        {
          "mine": false,
          "text": "ok noté, tu ramènes le dossier?"
        },
        {
          "mine": true,
          "text": "oui je l'imprime avant"
        }
      ]
    },
    {
      "name": "Océane",
      "messages": [
        {
          "mine": false,
          "text": "t'as vu il neige!"
        },
        {
          "mine": true,
          "text": "ah génial les enfants vont adorer"
        },
        {
          "mine": true,
          "text": "on sort faire un bonhomme de neige?"
        },
        {
          "mine": false,
          "text": "oui carrément, on se rejoint au parc"
        },
        {
          "mine": false,
          "text": "mettez vous bien couverts"
        },
        {
          "mine": true,
          "text": "oui bonnets et gants, à toute"
        }
      ]
    },
    {
      "name": "Le garagiste",
      "messages": [
        {
          "mine": true,
          "text": "bonjour, la révision est prête?"
        },
        {
          "mine": false,
          "text": "bonjour oui, vous pouvez récupérer la voiture ce soir"
        },
        {
          "mine": true,
          "text": "super, avant 18h ça va?"
        },
        {
          "mine": false,
          "text": "oui on ferme à 19h"
        },
        {
          "mine": true,
          "text": "parfait j'arrive vers 17h30 merci"
        }
      ]
    },
    {
      "name": "Lucas",
      "messages": [
        {
          "mine": false,
          "text": "tu viens à l'apéro vendredi?"
        },
        {
          "mine": true,
          "text": "oui chez qui?"
        },
        {
          "mine": false,
          "text": "chez moi, à partir de 19h"
        },
        {
          "mine": true,
          "text": "cool je ramène quoi?"
        },
        {
          "mine": false,
          "text": "juste une bouteille de rouge si tu veux"
        },
        {
          "mine": true,
          "text": "ok à vendredi"
        }
      ]
    },
    {
      "name": "Sœur",
      "messages": [
        {
          "mine": true,
          "text": "tu as fini le livre que je t'ai prêté?"
        },
        {
          "mine": false,
          "text": "presque, plus que 50 pages"
        },
        {
          "mine": true,
          "text": "il est bien hein?"
        },
        {
          "mine": false,
          "text": "trop bien j'accroche à fond"
        },
        {
          "mine": true,
          "text": "tu me le rends quand tu veux, prends ton temps"
        }
      ]
    },
    {
      "name": "Marie",
      "messages": [
        {
          "mine": false,
          "text": "tu bosses jusqu'à quelle heure aujourd'hui?"
        },
        {
          "mine": true,
          "text": "18h normalement pourquoi?"
        },
        {
          "mine": false,
          "text": "on pourrait dîner ensemble si t'es libre"
        },
        {
          "mine": true,
          "text": "oui avec plaisir, italien?"
        },
        {
          "mine": false,
          "text": "parfait je réserve pour 20h"
        }
      ]
    },
    {
      "name": "Voisin Michel",
      "messages": [
        {
          "mine": false,
          "text": "bonjour, vous pouvez arroser mes plantes cette semaine? on part"
        },
        {
          "mine": true,
          "text": "bonjour, oui bien sur, laissez moi la clé"
        },
        {
          "mine": false,
          "text": "merci, je la mets dans votre boite aux lettres"
        },
        {
          "mine": true,
          "text": "parfait bonnes vacances!"
        },
        {
          "mine": false,
          "text": "merci à vous, à bientot"
        }
      ]
    },
    {
      "name": "Pauline",
      "messages": [
        {
          "mine": true,
          "text": "tu peux récupérer le pain à la boulangerie?"
        },
        {
          "mine": false,
          "text": "oui, une baguette?"
        },
        {
          "mine": true,
          "text": "deux stp et un croissant pour le petit"
        },
        {
          "mine": false,
          "text": "ok c'est noté"
        },
        {
          "mine": true,
          "text": "merci t'es un amour"
        }
      ]
    },
    {
      "name": "Hugo",
      "messages": [
        {
          "mine": false,
          "text": "on se fait un ciné ce soir?"
        },
        {
          "mine": true,
          "text": "oui il y a quoi de bien?"
        },
        {
          "mine": false,
          "text": "le nouveau film d'animation a l'air sympa"
        },
        {
          "mine": true,
          "text": "ah oui les enfants adoreraient"
        },
        {
          "mine": false,
          "text": "séance de 18h?"
        },
        {
          "mine": true,
          "text": "parfait on se retrouve là bas"
        }
      ]
    },
    {
      "name": "Aurélie",
      "messages": [
        {
          "mine": true,
          "text": "tu as des nouvelles pour le devis de la cuisine?"
        },
        {
          "mine": false,
          "text": "oui reçu ce matin, un peu cher je trouve"
        },
        {
          "mine": true,
          "text": "combien?"
        },
        {
          "mine": false,
          "text": "faut qu'on en discute, on s'appelle ce soir?"
        },
        {
          "mine": true,
          "text": "ok vers 20h après le dîner"
        }
      ]
    },
    {
      "name": "Papi",
      "messages": [
        {
          "mine": false,
          "text": "alors ce match hier soir?"
        },
        {
          "mine": true,
          "text": "on a perdu 2-1 papi, dommage"
        },
        {
          "mine": false,
          "text": "ah zut, ils jouaient mal?"
        },
        {
          "mine": true,
          "text": "un peu mous oui, mais bon"
        },
        {
          "mine": false,
          "text": "la prochaine fois! tu passes dimanche?"
        },
        {
          "mine": true,
          "text": "oui avec plaisir"
        }
      ]
    },
    {
      "name": "Sabrina",
      "messages": [
        {
          "mine": true,
          "text": "tu viens à la fête d'anniversaire de mia samedi?"
        },
        {
          "mine": false,
          "text": "oui! elle a quel age déjà?"
        },
        {
          "mine": true,
          "text": "elle fête ses 7 ans"
        },
        {
          "mine": false,
          "text": "déjà! le temps passe. je ramène quoi?"
        },
        {
          "mine": true,
          "text": "rien juste toi, y a un gateau"
        }
      ]
    },
    {
      "name": "Jérôme",
      "messages": [
        {
          "mine": false,
          "text": "tu peux me remplacer demain matin? j'ai un empechement"
        },
        {
          "mine": true,
          "text": "c'est quel créneau?"
        },
        {
          "mine": false,
          "text": "8h-12h, je te revaudrai ça"
        },
        {
          "mine": true,
          "text": "ok ça marche pour cette fois"
        },
        {
          "mine": false,
          "text": "merci t'es sauveur"
        }
      ]
    },
    {
      "name": "Elodie",
      "messages": [
        {
          "mine": true,
          "text": "il te reste du sucre? j'en manque pour le gateau"
        },
        {
          "mine": false,
          "text": "oui j'en ai, passe le prendre"
        },
        {
          "mine": true,
          "text": "j'arrive dans 5 min merci voisine"
        },
        {
          "mine": false,
          "text": "pas de souci la porte est ouverte"
        }
      ]
    },
    {
      "name": "Fabien",
      "messages": [
        {
          "mine": false,
          "text": "on covoiture pour aller au boulot demain?"
        },
        {
          "mine": true,
          "text": "oui bonne idée, tu passes ou je passe?"
        },
        {
          "mine": false,
          "text": "je passe te prendre à 8h"
        },
        {
          "mine": true,
          "text": "parfait je serai en bas"
        },
        {
          "mine": false,
          "text": "à demain alors"
        }
      ]
    },
    {
      "name": "Nadia",
      "messages": [
        {
          "mine": true,
          "text": "tu as trouvé une baby sitter pour vendredi?"
        },
        {
          "mine": false,
          "text": "pas encore, tu connais quelqu'un?"
        },
        {
          "mine": true,
          "text": "oui la fille des voisins est super sérieuse"
        },
        {
          "mine": false,
          "text": "ah top tu me passes son numéro?"
        },
        {
          "mine": true,
          "text": "je te le donne ce soir"
        }
      ]
    },
    {
      "name": "Benoît",
      "messages": [
        {
          "mine": false,
          "text": "tu veux qu'on aille courir demain matin?"
        },
        {
          "mine": true,
          "text": "oui à quelle heure?"
        },
        {
          "mine": false,
          "text": "7h avant qu'il fasse trop chaud"
        },
        {
          "mine": true,
          "text": "ok ça me motive, rdv au parc"
        },
        {
          "mine": false,
          "text": "nickel prends de l'eau"
        }
      ]
    },
    {
      "name": "Sophie",
      "messages": [
        {
          "mine": true,
          "text": "tu as le numéro du dentiste? j'ai mal à une dent"
        },
        {
          "mine": false,
          "text": "oui je te l'envoie, aïe courage"
        },
        {
          "mine": true,
          "text": "merci ça me lance depuis hier"
        },
        {
          "mine": false,
          "text": "prends rdv vite ça va pas s'arranger"
        },
        {
          "mine": true,
          "text": "ouais j'appelle tout de suite"
        }
      ]
    },
    {
      "name": "Alexandre",
      "messages": [
        {
          "mine": false,
          "text": "le colis est arrivé chez toi par erreur je crois"
        },
        {
          "mine": true,
          "text": "ah oui il y a un paquet à ton nom"
        },
        {
          "mine": false,
          "text": "je passe le récupérer ce soir?"
        },
        {
          "mine": true,
          "text": "oui je suis là après 19h"
        },
        {
          "mine": false,
          "text": "parfait merci d'avoir gardé"
        }
      ]
    },
    {
      "name": "Laetitia",
      "messages": [
        {
          "mine": true,
          "text": "réunion parents profs c'est bien jeudi?"
        },
        {
          "mine": false,
          "text": "oui à 18h dans la classe de mme durand"
        },
        {
          "mine": true,
          "text": "ok on y va ensemble?"
        },
        {
          "mine": false,
          "text": "oui je passe te prendre à 17h45"
        },
        {
          "mine": true,
          "text": "super à jeudi"
        }
      ]
    },
    {
      "name": "Guillaume",
      "messages": [
        {
          "mine": false,
          "text": "tu regardes le documentaire ce soir?"
        },
        {
          "mine": true,
          "text": "lequel?"
        },
        {
          "mine": false,
          "text": "celui sur les océans, il parait qu'il est magnifique"
        },
        {
          "mine": true,
          "text": "ah oui je note, à 21h?"
        },
        {
          "mine": false,
          "text": "ouais sur la deux"
        }
      ]
    },
    {
      "name": "Céline",
      "messages": [
        {
          "mine": true,
          "text": "tu as reçu ton bulletin de salaire? le mien n'est pas arrivé"
        },
        {
          "mine": false,
          "text": "oui reçu ce matin, bizarre"
        },
        {
          "mine": true,
          "text": "faut que je demande aux rh alors"
        },
        {
          "mine": false,
          "text": "ouais un simple oubli surement"
        },
        {
          "mine": true,
          "text": "j'espère, merci"
        }
      ]
    },
    {
      "name": "Vincent",
      "messages": [
        {
          "mine": false,
          "text": "le barbecue de dimanche tient toujours?"
        },
        {
          "mine": true,
          "text": "oui si la météo suit"
        },
        {
          "mine": false,
          "text": "prévu grand soleil parait il"
        },
        {
          "mine": true,
          "text": "parfait je m'occupe des merguez"
        },
        {
          "mine": false,
          "text": "et moi des salades, ça marche"
        }
      ]
    },
    {
      "name": "Amandine",
      "messages": [
        {
          "mine": true,
          "text": "tu peux me prêter ta robe bleue pour le mariage?"
        },
        {
          "mine": false,
          "text": "oui bien sur elle t'ira super bien"
        },
        {
          "mine": true,
          "text": "merci trop gentille, je passe quand?"
        },
        {
          "mine": false,
          "text": "demain soir si tu veux"
        },
        {
          "mine": true,
          "text": "parfait à demain"
        }
      ]
    },
    {
      "name": "Pierre",
      "messages": [
        {
          "mine": false,
          "text": "tu as fini de tondre la pelouse?"
        },
        {
          "mine": true,
          "text": "presque, la tondeuse a calé deux fois"
        },
        {
          "mine": false,
          "text": "ah encore ce truc, faut la faire réviser"
        },
        {
          "mine": true,
          "text": "ouais elle commence à fatiguer"
        },
        {
          "mine": false,
          "text": "on regarde ça ensemble ce weekend"
        }
      ]
    },
    {
      "name": "Docteur Martin",
      "messages": [
        {
          "mine": false,
          "text": "bonjour, vos résultats sont normaux, rien d'inquiétant"
        },
        {
          "mine": true,
          "text": "bonjour, merci ça me rassure"
        },
        {
          "mine": false,
          "text": "on refait un point dans 6 mois"
        },
        {
          "mine": true,
          "text": "d'accord je prends rdv, bonne journée"
        }
      ]
    },
    {
      "name": "Delphine",
      "messages": [
        {
          "mine": true,
          "text": "tu viens au cours de yoga ce soir?"
        },
        {
          "mine": false,
          "text": "oui à 19h c'est ça?"
        },
        {
          "mine": true,
          "text": "oui apporte ton tapis"
        },
        {
          "mine": false,
          "text": "ok j'ai hate ça détend bien"
        },
        {
          "mine": true,
          "text": "à ce soir alors"
        }
      ]
    },
    {
      "name": "Yanis",
      "messages": [
        {
          "mine": false,
          "text": "tu m'aides à déménager samedi? juste quelques cartons"
        },
        {
          "mine": true,
          "text": "oui pas de souci, à quelle heure?"
        },
        {
          "mine": false,
          "text": "vers 10h, je paie la pizza après"
        },
        {
          "mine": true,
          "text": "haha vendu, à samedi"
        },
        {
          "mine": false,
          "text": "merci mec ça me sauve"
        }
      ]
    },
    {
      "name": "Isabelle",
      "messages": [
        {
          "mine": true,
          "text": "tu as des nouvelles de la commande du canapé?"
        },
        {
          "mine": false,
          "text": "oui livraison prévue le 15"
        },
        {
          "mine": true,
          "text": "ah enfin! ils ont mis le temps"
        },
        {
          "mine": false,
          "text": "ouais presque deux mois"
        },
        {
          "mine": true,
          "text": "vivement qu'on l'ait"
        }
      ]
    },
    {
      "name": "Théo",
      "messages": [
        {
          "mine": false,
          "text": "tu as révisé pour le contrôle de maths?"
        },
        {
          "mine": true,
          "text": "un peu, les fractions me saoulent"
        },
        {
          "mine": false,
          "text": "on révise ensemble cet aprem?"
        },
        {
          "mine": true,
          "text": "oui bonne idée chez toi?"
        },
        {
          "mine": false,
          "text": "ouais viens à 15h"
        }
      ]
    },
    {
      "name": "Karine",
      "messages": [
        {
          "mine": true,
          "text": "le chien a encore fait des bêtises?"
        },
        {
          "mine": false,
          "text": "oui il a mangé une chaussure"
        },
        {
          "mine": true,
          "text": "oh non pas encore haha"
        },
        {
          "mine": false,
          "text": "faut vraiment qu'on l'éduque mieux"
        },
        {
          "mine": true,
          "text": "un cours de dressage peut etre"
        }
      ]
    },
    {
      "name": "Bruno",
      "messages": [
        {
          "mine": false,
          "text": "tu peux venir m'aider à porter l'armoire?"
        },
        {
          "mine": true,
          "text": "oui j'arrive dans 10 min"
        },
        {
          "mine": false,
          "text": "merci elle est super lourde"
        },
        {
          "mine": true,
          "text": "on va y arriver à deux"
        },
        {
          "mine": false,
          "text": "ouais fais gaffe à ton dos"
        }
      ]
    },
    {
      "name": "Charlotte",
      "messages": [
        {
          "mine": true,
          "text": "tu fais quoi pour le repas de noël cette année?"
        },
        {
          "mine": false,
          "text": "une dinde comme d'hab, et toi les entrées?"
        },
        {
          "mine": true,
          "text": "oui je m'occupe des toasts et du foie gras"
        },
        {
          "mine": false,
          "text": "parfait on se répartit bien"
        },
        {
          "mine": true,
          "text": "vivement noël"
        }
      ]
    },
    {
      "name": "Damien",
      "messages": [
        {
          "mine": false,
          "text": "le train a du retard, je vais arriver en retard au taf"
        },
        {
          "mine": true,
          "text": "ah galère, préviens le chef"
        },
        {
          "mine": false,
          "text": "ouais je lui envoie un message"
        },
        {
          "mine": true,
          "text": "courage ça arrive"
        },
        {
          "mine": false,
          "text": "merci à tout à l'heure"
        }
      ]
    },
    {
      "name": "Valérie",
      "messages": [
        {
          "mine": true,
          "text": "tu passes à la pharmacie? il me faut du doliprane"
        },
        {
          "mine": false,
          "text": "oui j'y vais tout à l'heure"
        },
        {
          "mine": true,
          "text": "merci et du sirop pour la toux aussi stp"
        },
        {
          "mine": false,
          "text": "ok noté, tu es malade?"
        },
        {
          "mine": true,
          "text": "un petit rhume rien de grave"
        }
      ]
    },
    {
      "name": "Adrien",
      "messages": [
        {
          "mine": false,
          "text": "on joue au tennis dimanche matin?"
        },
        {
          "mine": true,
          "text": "oui le court est réservé?"
        },
        {
          "mine": false,
          "text": "je réserve pour 10h"
        },
        {
          "mine": true,
          "text": "parfait faut que je m'entraine, tu me bats toujours"
        },
        {
          "mine": false,
          "text": "haha on verra"
        }
      ]
    },
    {
      "name": "Morgane",
      "messages": [
        {
          "mine": true,
          "text": "tu as vu le prix des tomates au marché? c'est fou"
        },
        {
          "mine": false,
          "text": "oui c'est la saison qui joue"
        },
        {
          "mine": true,
          "text": "j'attendrai un peu alors"
        },
        {
          "mine": false,
          "text": "ouais ça baissera vite"
        },
        {
          "mine": true,
          "text": "j'espère bien"
        }
      ]
    },
    {
      "name": "Olivier",
      "messages": [
        {
          "mine": false,
          "text": "tu viens à la réunion de copro jeudi?"
        },
        {
          "mine": true,
          "text": "c'est à quelle heure?"
        },
        {
          "mine": false,
          "text": "19h dans le hall"
        },
        {
          "mine": true,
          "text": "ok j'essaie de passer, y a l'histoire de l'ascenseur"
        },
        {
          "mine": false,
          "text": "oui justement faut voter pour les travaux"
        }
      ]
    },
    {
      "name": "Jessica",
      "messages": [
        {
          "mine": true,
          "text": "tu m'accompagnes faire du shopping demain?"
        },
        {
          "mine": false,
          "text": "oui avec plaisir, il me faut un manteau"
        },
        {
          "mine": true,
          "text": "cool on ira au centre commercial"
        },
        {
          "mine": false,
          "text": "rdv 14h à l'entrée?"
        },
        {
          "mine": true,
          "text": "parfait à demain"
        }
      ]
    },
    {
      "name": "Franck",
      "messages": [
        {
          "mine": false,
          "text": "la clim du bureau est encore en panne"
        },
        {
          "mine": true,
          "text": "sérieux? il fait une chaleur"
        },
        {
          "mine": false,
          "text": "ouais on cuit, ils ont appelé le technicien"
        },
        {
          "mine": true,
          "text": "vivement qu'il passe"
        },
        {
          "mine": false,
          "text": "il vient demain matin apparemment"
        }
      ]
    },
    {
      "name": "Laura",
      "messages": [
        {
          "mine": true,
          "text": "tu gardes toujours mon chat le weekend prochain?"
        },
        {
          "mine": false,
          "text": "oui pas de souci, tu m'apportes ses croquettes?"
        },
        {
          "mine": true,
          "text": "oui et son panier, il aime bien"
        },
        {
          "mine": false,
          "text": "parfait il sera gaté"
        },
        {
          "mine": true,
          "text": "merci mille fois"
        }
      ]
    },
    {
      "name": "Mathieu",
      "messages": [
        {
          "mine": false,
          "text": "on se fait une partie de cartes ce soir?"
        },
        {
          "mine": true,
          "text": "oui belote ou tarot?"
        },
        {
          "mine": false,
          "text": "belote, plus rapide"
        },
        {
          "mine": true,
          "text": "ok je ramène les cartes, chez toi?"
        },
        {
          "mine": false,
          "text": "ouais viens à 20h"
        }
      ]
    },
    {
      "name": "Nathalie",
      "messages": [
        {
          "mine": true,
          "text": "la réunion de demain est décalée à 11h finalement"
        },
        {
          "mine": false,
          "text": "ah ok merci de prévenir"
        },
        {
          "mine": true,
          "text": "oui le client a demandé"
        },
        {
          "mine": false,
          "text": "pas de souci je note dans l'agenda"
        },
        {
          "mine": true,
          "text": "super à demain"
        }
      ]
    },
    {
      "name": "Quentin",
      "messages": [
        {
          "mine": false,
          "text": "tu as pensé à sortir les poubelles?"
        },
        {
          "mine": true,
          "text": "ah zut non, c'est ce soir?"
        },
        {
          "mine": false,
          "text": "oui le jaune ce soir"
        },
        {
          "mine": true,
          "text": "ok je descends ça tout de suite"
        },
        {
          "mine": false,
          "text": "merci"
        }
      ]
    },
    {
      "name": "Aline",
      "messages": [
        {
          "mine": true,
          "text": "tu connais un bon coiffeur dans le quartier?"
        },
        {
          "mine": false,
          "text": "oui celui de la rue du marché est top"
        },
        {
          "mine": true,
          "text": "ah cool ils prennent sans rdv?"
        },
        {
          "mine": false,
          "text": "non faut appeler mais ils sont rapides"
        },
        {
          "mine": true,
          "text": "ok merci du tuyau"
        }
      ]
    },
    {
      "name": "Gérard",
      "messages": [
        {
          "mine": false,
          "text": "le potager donne bien cette année, tu veux des courgettes?"
        },
        {
          "mine": true,
          "text": "oh oui avec plaisir!"
        },
        {
          "mine": false,
          "text": "j'en ai plein passe quand tu veux"
        },
        {
          "mine": true,
          "text": "je passe demain matin"
        },
        {
          "mine": false,
          "text": "parfait j'en mets de coté"
        }
      ]
    },
    {
      "name": "Estelle",
      "messages": [
        {
          "mine": true,
          "text": "tu viens à la kermesse de l'école samedi?"
        },
        {
          "mine": false,
          "text": "oui les enfants adorent, à quelle heure?"
        },
        {
          "mine": true,
          "text": "ça ouvre à 14h"
        },
        {
          "mine": false,
          "text": "parfait on se retrouve là bas"
        },
        {
          "mine": true,
          "text": "oui devant les stands"
        }
      ]
    },
    {
      "name": "Cédric",
      "messages": [
        {
          "mine": false,
          "text": "ta voiture est réparée finalement?"
        },
        {
          "mine": true,
          "text": "oui juste les plaquettes, ouf"
        },
        {
          "mine": false,
          "text": "ça t'a couté cher?"
        },
        {
          "mine": true,
          "text": "raisonnable heureusement"
        },
        {
          "mine": false,
          "text": "tant mieux, roule prudemment"
        }
      ]
    },
    {
      "name": "Mélanie",
      "messages": [
        {
          "mine": true,
          "text": "tu peux me rappeler la recette du gratin dauphinois?"
        },
        {
          "mine": false,
          "text": "pommes de terre, crème, ail, un peu de muscade"
        },
        {
          "mine": true,
          "text": "pas de fromage?"
        },
        {
          "mine": false,
          "text": "un peu de gruyère dessus si tu veux"
        },
        {
          "mine": true,
          "text": "parfait merci ça sent bon d'avance"
        }
      ]
    },
    {
      "name": "Sébastien",
      "messages": [
        {
          "mine": false,
          "text": "on part à quelle heure demain pour la plage?"
        },
        {
          "mine": true,
          "text": "tot vers 8h pour éviter les bouchons"
        },
        {
          "mine": false,
          "text": "ok je prépare le pique nique"
        },
        {
          "mine": true,
          "text": "et moi le parasol et les serviettes"
        },
        {
          "mine": false,
          "text": "nickel à demain"
        }
      ]
    },
    {
      "name": "Corinne",
      "messages": [
        {
          "mine": true,
          "text": "tu as des nouvelles de mamie? je l'ai pas eue"
        },
        {
          "mine": false,
          "text": "oui je l'ai appelée hier elle va bien"
        },
        {
          "mine": true,
          "text": "ah tant mieux ça me rassure"
        },
        {
          "mine": false,
          "text": "elle demandait de tes nouvelles"
        },
        {
          "mine": true,
          "text": "je l'appelle ce soir"
        }
      ]
    },
    {
      "name": "Florian",
      "messages": [
        {
          "mine": false,
          "text": "tu veux mes places de concert? je peux pas y aller"
        },
        {
          "mine": true,
          "text": "ah c'est dommage, c'est quel jour?"
        },
        {
          "mine": false,
          "text": "vendredi soir, deux places"
        },
        {
          "mine": true,
          "text": "je regarde si je suis libre et je te dis"
        },
        {
          "mine": false,
          "text": "ok tiens moi au courant"
        }
      ]
    },
    {
      "name": "Sandrine",
      "messages": [
        {
          "mine": true,
          "text": "la machine à laver fait un bruit horrible"
        },
        {
          "mine": false,
          "text": "aïe, elle est vieille?"
        },
        {
          "mine": true,
          "text": "5 ans à peu près"
        },
        {
          "mine": false,
          "text": "appelle un réparateur avant qu'elle lache"
        },
        {
          "mine": true,
          "text": "ouais je vais chercher un numéro"
        }
      ]
    },
    {
      "name": "Étienne",
      "messages": [
        {
          "mine": false,
          "text": "tu passes récupérer les clés quand?"
        },
        {
          "mine": true,
          "text": "je peux passer ce soir vers 18h"
        },
        {
          "mine": false,
          "text": "parfait je serai là"
        },
        {
          "mine": true,
          "text": "merci de garder l'appart pendant les travaux"
        },
        {
          "mine": false,
          "text": "de rien c'est normal"
        }
      ]
    },
    {
      "name": "Virginie",
      "messages": [
        {
          "mine": true,
          "text": "tu as réservé le resto pour l'anniv de papa?"
        },
        {
          "mine": false,
          "text": "oui pour 8 personnes samedi 20h"
        },
        {
          "mine": true,
          "text": "super, il va etre surpris"
        },
        {
          "mine": false,
          "text": "chut c'est une surprise!"
        },
        {
          "mine": true,
          "text": "promis je dis rien haha"
        }
      ]
    },
    {
      "name": "Rachid",
      "messages": [
        {
          "mine": false,
          "text": "tu bosses tard ce soir?"
        },
        {
          "mine": true,
          "text": "non je finis à 17h aujourd'hui"
        },
        {
          "mine": false,
          "text": "cool on prend un verre après?"
        },
        {
          "mine": true,
          "text": "oui volontiers, au café d'en bas?"
        },
        {
          "mine": false,
          "text": "parfait à 17h30"
        }
      ]
    },
    {
      "name": "Patricia",
      "messages": [
        {
          "mine": true,
          "text": "les rideaux sont arrivés, ils sont trop beaux"
        },
        {
          "mine": false,
          "text": "ah super montre moi une photo"
        },
        {
          "mine": true,
          "text": "je t'envoie ça, le bleu rend bien"
        },
        {
          "mine": false,
          "text": "j'adore, ça change le salon"
        },
        {
          "mine": true,
          "text": "oui je suis contente"
        }
      ]
    },
    {
      "name": "Gaël",
      "messages": [
        {
          "mine": false,
          "text": "la réunion d'équipe est reportée à lundi"
        },
        {
          "mine": true,
          "text": "ah ok des raisons?"
        },
        {
          "mine": false,
          "text": "la moitié est en congé cette semaine"
        },
        {
          "mine": true,
          "text": "logique, ça marche pour lundi"
        },
        {
          "mine": false,
          "text": "je remets l'invit dans l'agenda"
        }
      ]
    },
    {
      "name": "Coralie",
      "messages": [
        {
          "mine": true,
          "text": "tu veux venir cueillir des fraises dimanche?"
        },
        {
          "mine": false,
          "text": "oh oui les enfants vont adorer"
        },
        {
          "mine": true,
          "text": "il y a une ferme pas loin"
        },
        {
          "mine": false,
          "text": "on prend des paniers alors"
        },
        {
          "mine": true,
          "text": "oui et de quoi pique niquer"
        }
      ]
    },
    {
      "name": "Ludovic",
      "messages": [
        {
          "mine": false,
          "text": "tu m'aides à repeindre la chambre ce weekend?"
        },
        {
          "mine": true,
          "text": "oui quelle couleur?"
        },
        {
          "mine": false,
          "text": "un vert d'eau tout doux"
        },
        {
          "mine": true,
          "text": "joli, je ramène des pinceaux"
        },
        {
          "mine": false,
          "text": "top merci, j'ai déjà la peinture"
        }
      ]
    },
    {
      "name": "Béatrice",
      "messages": [
        {
          "mine": true,
          "text": "tu as bien reçu l'invitation pour le baptême?"
        },
        {
          "mine": false,
          "text": "oui merci, on sera là avec plaisir"
        },
        {
          "mine": true,
          "text": "super ça nous fait très plaisir"
        },
        {
          "mine": false,
          "text": "c'est bien le 12 juin?"
        },
        {
          "mine": true,
          "text": "oui à l'église à 11h"
        }
      ]
    },
    {
      "name": "Samir",
      "messages": [
        {
          "mine": false,
          "text": "tu as le foot des petits samedi?"
        },
        {
          "mine": true,
          "text": "oui match à 10h, tu emmènes le tien?"
        },
        {
          "mine": false,
          "text": "oui on peut covoiturer"
        },
        {
          "mine": true,
          "text": "parfait je passe vous prendre à 9h30"
        },
        {
          "mine": false,
          "text": "nickel merci"
        }
      ]
    },
    {
      "name": "Audrey",
      "messages": [
        {
          "mine": true,
          "text": "tu me prêtes ton appareil photo pour le weekend?"
        },
        {
          "mine": false,
          "text": "oui bien sur, tu pars quelque part?"
        },
        {
          "mine": true,
          "text": "oui rando en montagne, ça va etre beau"
        },
        {
          "mine": false,
          "text": "cool prends soin de lui haha"
        },
        {
          "mine": true,
          "text": "promis je te le rends lundi"
        }
      ]
    },
    {
      "name": "Christophe",
      "messages": [
        {
          "mine": false,
          "text": "le devis pour la toiture est arrivé"
        },
        {
          "mine": true,
          "text": "ah et alors, ça donne quoi?"
        },
        {
          "mine": false,
          "text": "faut qu'on en parle, c'est un budget"
        },
        {
          "mine": true,
          "text": "on regarde ce soir tranquillement"
        },
        {
          "mine": false,
          "text": "ok après le dîner"
        }
      ]
    },
    {
      "name": "Fatima",
      "messages": [
        {
          "mine": true,
          "text": "tu passes prendre le the demain aprem?"
        },
        {
          "mine": false,
          "text": "avec plaisir, je ramène des gateaux"
        },
        {
          "mine": true,
          "text": "oh super, vers 15h?"
        },
        {
          "mine": false,
          "text": "parfait à demain"
        },
        {
          "mine": true,
          "text": "j'ai hate, bisous"
        }
      ]
    },
    {
      "name": "Rémi",
      "messages": [
        {
          "mine": false,
          "text": "tu as vu le nouveau boulanger a ouvert?"
        },
        {
          "mine": true,
          "text": "ah non, c'est bien?"
        },
        {
          "mine": false,
          "text": "leurs croissants sont incroyables"
        },
        {
          "mine": true,
          "text": "faut que j'aille tester alors"
        },
        {
          "mine": false,
          "text": "ouais tu vas adorer"
        }
      ]
    },
    {
      "name": "Sonia",
      "messages": [
        {
          "mine": true,
          "text": "tu peux récupérer les enfants à l'école? je suis coincée"
        },
        {
          "mine": false,
          "text": "oui pas de souci, sortie 16h30?"
        },
        {
          "mine": true,
          "text": "oui merci tu me sauves"
        },
        {
          "mine": false,
          "text": "de rien je les garde jusqu'à ton retour"
        },
        {
          "mine": true,
          "text": "t'es adorable"
        }
      ]
    },
    {
      "name": "Loïc",
      "messages": [
        {
          "mine": false,
          "text": "on se fait une soirée jeux de société vendredi?"
        },
        {
          "mine": true,
          "text": "oui bonne idée, on invite qui?"
        },
        {
          "mine": false,
          "text": "les voisins et ton frère?"
        },
        {
          "mine": true,
          "text": "parfait je prévois l'apéro"
        },
        {
          "mine": false,
          "text": "et moi les jeux, à vendredi"
        }
      ]
    },
    {
      "name": "Christelle",
      "messages": [
        {
          "mine": true,
          "text": "tu as fini de préparer les affaires pour la colo?"
        },
        {
          "mine": false,
          "text": "presque, il manque le sac de couchage"
        },
        {
          "mine": true,
          "text": "je crois qu'il est au grenier"
        },
        {
          "mine": false,
          "text": "ah oui merci je vais voir"
        },
        {
          "mine": true,
          "text": "faut pas oublier la crème solaire aussi"
        }
      ]
    },
    {
      "name": "David",
      "messages": [
        {
          "mine": false,
          "text": "tu viens au foot ce dimanche on manque de joueurs"
        },
        {
          "mine": true,
          "text": "oui je peux venir, à quelle heure?"
        },
        {
          "mine": false,
          "text": "10h au stade municipal"
        },
        {
          "mine": true,
          "text": "ok je prends mes crampons"
        },
        {
          "mine": false,
          "text": "super à dimanche"
        }
      ]
    },
    {
      "name": "Anaïs",
      "messages": [
        {
          "mine": true,
          "text": "tu as des idées de cadeau pour maman?"
        },
        {
          "mine": false,
          "text": "un joli foulard peut etre?"
        },
        {
          "mine": true,
          "text": "ah oui elle adore ça"
        },
        {
          "mine": false,
          "text": "on peut aller en choisir un ensemble"
        },
        {
          "mine": true,
          "text": "oui samedi ça te va?"
        },
        {
          "mine": false,
          "text": "parfait"
        }
      ]
    },
    {
      "name": "Marc",
      "messages": [
        {
          "mine": false,
          "text": "le rdv chez le notaire est confirmé pour vendredi"
        },
        {
          "mine": true,
          "text": "ok à quelle heure déjà?"
        },
        {
          "mine": false,
          "text": "14h, n'oublie pas les papiers"
        },
        {
          "mine": true,
          "text": "oui je les ai préparés"
        },
        {
          "mine": false,
          "text": "parfait à vendredi"
        }
      ]
    },
    {
      "name": "Justine",
      "messages": [
        {
          "mine": true,
          "text": "tu veux qu'on aille à la médiathèque cet aprem?"
        },
        {
          "mine": false,
          "text": "oui je dois rendre des livres justement"
        },
        {
          "mine": true,
          "text": "cool on y va vers 15h?"
        },
        {
          "mine": false,
          "text": "ça marche, les enfants prendront des bd"
        },
        {
          "mine": true,
          "text": "parfait à toute"
        }
      ]
    },
    {
      "name": "Yann",
      "messages": [
        {
          "mine": false,
          "text": "il fait un temps magnifique aujourd'hui"
        },
        {
          "mine": true,
          "text": "oui enfin du soleil!"
        },
        {
          "mine": true,
          "text": "ça donne envie de sortir"
        },
        {
          "mine": false,
          "text": "on va se promener au bord du fleuve?"
        },
        {
          "mine": true,
          "text": "oui super idée, à tout de suite"
        }
      ]
    },
    {
      "name": "Brigitte",
      "messages": [
        {
          "mine": true,
          "text": "tu as la recette de la confiture de mamie?"
        },
        {
          "mine": false,
          "text": "oui je te la recopie, c'est surtout du temps de cuisson"
        },
        {
          "mine": true,
          "text": "combien de sucre pour les abricots?"
        },
        {
          "mine": false,
          "text": "800g de sucre pour 1kg de fruits"
        },
        {
          "mine": true,
          "text": "parfait merci je m'y mets ce weekend"
        }
      ]
    },
    {
      "name": "Dylan",
      "messages": [
        {
          "mine": false,
          "text": "tu as les résultats du bulletin?"
        },
        {
          "mine": true,
          "text": "oui plutot bien ce trimestre"
        },
        {
          "mine": false,
          "text": "super fier de toi!"
        },
        {
          "mine": true,
          "text": "merci j'ai bien bossé"
        },
        {
          "mine": false,
          "text": "on fete ça ce weekend"
        }
      ]
    },
    {
      "name": "Hélène",
      "messages": [
        {
          "mine": true,
          "text": "tu viens à la chorale jeudi soir?"
        },
        {
          "mine": false,
          "text": "oui à 20h à la salle des fetes"
        },
        {
          "mine": true,
          "text": "on prépare le concert de fin d'année"
        },
        {
          "mine": false,
          "text": "j'ai hate, on chante quoi?"
        },
        {
          "mine": true,
          "text": "des classiques, tu vas aimer"
        }
      ]
    },
    {
      "name": "Tony",
      "messages": [
        {
          "mine": false,
          "text": "tu peux me passer le numéro du plombier?"
        },
        {
          "mine": true,
          "text": "oui je te l'envoie, il est sérieux"
        },
        {
          "mine": false,
          "text": "merci j'ai une fuite sous l'évier"
        },
        {
          "mine": true,
          "text": "aïe appelle vite avant que ça empire"
        },
        {
          "mine": false,
          "text": "ouais je fais ça tout de suite"
        }
      ]
    },
    {
      "name": "Séverine",
      "messages": [
        {
          "mine": true,
          "text": "on se fait un brunch dimanche?"
        },
        {
          "mine": false,
          "text": "oh oui j'adore, chez toi ou dehors?"
        },
        {
          "mine": true,
          "text": "chez moi c'est plus cool avec les enfants"
        },
        {
          "mine": false,
          "text": "parfait je ramène des viennoiseries"
        },
        {
          "mine": true,
          "text": "top à dimanche vers 11h"
        }
      ]
    }
  ],
  "it": [
    {
      "name": "Mamma",
      "messages": [
        {
          "mine": false,
          "text": "hai mangiato qualcosa a pranzo?"
        },
        {
          "mine": true,
          "text": "si un panino al volo, poi cucino stasera"
        },
        {
          "mine": false,
          "text": "ti ho lasciato la pasta al forno in frigo se vuoi"
        },
        {
          "mine": true,
          "text": "sei un mito grazie"
        },
        {
          "mine": false,
          "text": "riscaldala 10 min a 180"
        },
        {
          "mine": true,
          "text": "ok stasera passo anche a salutare"
        }
      ]
    },
    {
      "name": "Papà",
      "messages": [
        {
          "mine": true,
          "text": "pa mi presti il trapano nel weekend?"
        },
        {
          "mine": false,
          "text": "certo passa quando vuoi che è in garage"
        },
        {
          "mine": true,
          "text": "sabato mattina va bene?"
        },
        {
          "mine": false,
          "text": "perfetto ci sono, portami indietro anche la chiave inglese"
        },
        {
          "mine": true,
          "text": "vero scusa me la ero dimenticata"
        }
      ]
    },
    {
      "name": "Nonna",
      "messages": [
        {
          "mine": false,
          "text": "tesoro domenica vieni a pranzo? faccio le lasagne"
        },
        {
          "mine": true,
          "text": "certo nonna non me le perdo mai"
        },
        {
          "mine": false,
          "text": "porti anche il ragazzo?"
        },
        {
          "mine": true,
          "text": "si veniamo insieme verso l una"
        },
        {
          "mine": false,
          "text": "bene così faccio anche il tiramisù"
        },
        {
          "mine": true,
          "text": "ti voglio bene a domenica"
        }
      ]
    },
    {
      "name": "Nonno",
      "messages": [
        {
          "mine": true,
          "text": "nonno come va la schiena oggi?"
        },
        {
          "mine": false,
          "text": "meglio grazie, ho fatto due passi in giardino"
        },
        {
          "mine": true,
          "text": "bravo mi raccomando piano"
        },
        {
          "mine": false,
          "text": "tranquillo. quando vieni a vedere i pomodori?"
        },
        {
          "mine": true,
          "text": "domani pomeriggio se non piove"
        }
      ]
    },
    {
      "name": "Giulia",
      "messages": [
        {
          "mine": false,
          "text": "ci vediamo per un caffè domani?"
        },
        {
          "mine": true,
          "text": "si dai! che ora?"
        },
        {
          "mine": false,
          "text": "verso le 10 al bar di sempre?"
        },
        {
          "mine": true,
          "text": "perfetto ci sono"
        },
        {
          "mine": false,
          "text": "ottimo così ti racconto del corso nuovo"
        }
      ]
    },
    {
      "name": "Marco",
      "messages": [
        {
          "mine": true,
          "text": "hai visto la partita ieri sera?"
        },
        {
          "mine": false,
          "text": "no mi sono addormentato sul divano ahaha"
        },
        {
          "mine": true,
          "text": "hai perso poco tranquillo"
        },
        {
          "mine": false,
          "text": "meglio così. sabato campetto?"
        },
        {
          "mine": true,
          "text": "ci sto, alle 18 come al solito"
        },
        {
          "mine": false,
          "text": "top prenoto io"
        }
      ]
    },
    {
      "name": "Luca",
      "messages": [
        {
          "mine": false,
          "text": "mi ridai il libro quando puoi?"
        },
        {
          "mine": true,
          "text": "verissimo scusa, te lo porto lunedì in ufficio"
        },
        {
          "mine": false,
          "text": "nessun problema figurati"
        },
        {
          "mine": true,
          "text": "comunque bello, l ho finito in due giorni"
        },
        {
          "mine": false,
          "text": "te lo avevo detto"
        }
      ]
    },
    {
      "name": "Francesca",
      "messages": [
        {
          "mine": true,
          "text": "che fai di bello nel weekend?"
        },
        {
          "mine": false,
          "text": "niente di che, forse una gita al lago"
        },
        {
          "mine": true,
          "text": "che invidia, tempo permettendo"
        },
        {
          "mine": false,
          "text": "si speriamo non piova. tu?"
        },
        {
          "mine": true,
          "text": "riordino casa e basta ahah"
        }
      ]
    },
    {
      "name": "Chiara",
      "messages": [
        {
          "mine": false,
          "text": "domani riesci a passare in lavanderia?"
        },
        {
          "mine": true,
          "text": "si vado io dopo il lavoro"
        },
        {
          "mine": false,
          "text": "grazie, ci sono le camicie di papà"
        },
        {
          "mine": true,
          "text": "ok ritiro tutto"
        },
        {
          "mine": false,
          "text": "sei un tesoro"
        }
      ]
    },
    {
      "name": "Alessandro",
      "messages": [
        {
          "mine": true,
          "text": "a che ora ci vediamo stasera?"
        },
        {
          "mine": false,
          "text": "verso le 20 va bene?"
        },
        {
          "mine": true,
          "text": "perfetto, pizzeria di sempre?"
        },
        {
          "mine": false,
          "text": "si prenoto per 4"
        },
        {
          "mine": true,
          "text": "ottimo a dopo"
        }
      ]
    },
    {
      "name": "Sara",
      "messages": [
        {
          "mine": false,
          "text": "hai la ricetta della torta di mele?"
        },
        {
          "mine": true,
          "text": "si te la mando subito"
        },
        {
          "mine": false,
          "text": "grazie, la faccio per il compleanno di mia mamma"
        },
        {
          "mine": true,
          "text": "usa mele renette che vengono meglio"
        },
        {
          "mine": false,
          "text": "ottimo consiglio grazie"
        }
      ]
    },
    {
      "name": "Davide",
      "messages": [
        {
          "mine": true,
          "text": "mi dai un passaggio domani mattina?"
        },
        {
          "mine": false,
          "text": "certo a che ora?"
        },
        {
          "mine": true,
          "text": "verso le 8, ho l auto dal meccanico"
        },
        {
          "mine": false,
          "text": "ok passo sotto casa alle 8 in punto"
        },
        {
          "mine": true,
          "text": "grazie mille davvero"
        }
      ]
    },
    {
      "name": "Martina",
      "messages": [
        {
          "mine": false,
          "text": "ci prendiamo un aperitivo venerdì?"
        },
        {
          "mine": true,
          "text": "volentieri! le solite?"
        },
        {
          "mine": false,
          "text": "si dai porto anche vale"
        },
        {
          "mine": true,
          "text": "perfetto più siamo meglio è"
        },
        {
          "mine": false,
          "text": "prenoto per le 19"
        }
      ]
    },
    {
      "name": "Simone",
      "messages": [
        {
          "mine": true,
          "text": "riesci a coprirmi il turno di sabato?"
        },
        {
          "mine": false,
          "text": "che ora sarebbe?"
        },
        {
          "mine": true,
          "text": "dalle 9 alle 13"
        },
        {
          "mine": false,
          "text": "si dai ci sto, poi ti chiedo un cambio io"
        },
        {
          "mine": true,
          "text": "assolutamente, grazie mille"
        }
      ]
    },
    {
      "name": "Elena",
      "messages": [
        {
          "mine": false,
          "text": "hai comprato il regalo per sara?"
        },
        {
          "mine": true,
          "text": "non ancora, pensavo a una candela profumata"
        },
        {
          "mine": false,
          "text": "buona idea, dividiamo?"
        },
        {
          "mine": true,
          "text": "si dai facciamo metà e metà"
        },
        {
          "mine": false,
          "text": "perfetto lo prendo io domani"
        }
      ]
    },
    {
      "name": "Andrea",
      "messages": [
        {
          "mine": true,
          "text": "domani piove secondo te?"
        },
        {
          "mine": false,
          "text": "dice nuvoloso ma senza pioggia"
        },
        {
          "mine": true,
          "text": "bene allora facciamo la camminata"
        },
        {
          "mine": false,
          "text": "si ci vediamo al parco alle 9"
        },
        {
          "mine": true,
          "text": "ok porto l acqua"
        }
      ]
    },
    {
      "name": "Valentina",
      "messages": [
        {
          "mine": false,
          "text": "mi accompagni a fare la spesa dopo?"
        },
        {
          "mine": true,
          "text": "si passo verso le 17"
        },
        {
          "mine": false,
          "text": "grazie devo prendere tanta roba"
        },
        {
          "mine": true,
          "text": "ok andiamo al supermercato grande allora"
        },
        {
          "mine": false,
          "text": "perfetto a dopo"
        }
      ]
    },
    {
      "name": "Matteo",
      "messages": [
        {
          "mine": true,
          "text": "hai finito di montare la libreria?"
        },
        {
          "mine": false,
          "text": "quasi, manca solo l ultimo ripiano"
        },
        {
          "mine": true,
          "text": "bravo poi mandami una foto"
        },
        {
          "mine": false,
          "text": "certo, mi è avanzata pure una vite ahah"
        },
        {
          "mine": true,
          "text": "classico dell ikea"
        }
      ]
    },
    {
      "name": "Federica",
      "messages": [
        {
          "mine": false,
          "text": "domani porti tu i bambini a scuola?"
        },
        {
          "mine": true,
          "text": "si vado io, tu prendili nel pomeriggio"
        },
        {
          "mine": false,
          "text": "ok esco prima dal lavoro"
        },
        {
          "mine": true,
          "text": "perfetto così ci organizziamo"
        },
        {
          "mine": false,
          "text": "grazie amore"
        }
      ]
    },
    {
      "name": "Giorgio",
      "messages": [
        {
          "mine": true,
          "text": "a che ora è la riunione domani?"
        },
        {
          "mine": false,
          "text": "alle 10 in sala grande"
        },
        {
          "mine": true,
          "text": "ok preparo io le slide"
        },
        {
          "mine": false,
          "text": "grazie, aggiungi i dati del mese scorso"
        },
        {
          "mine": true,
          "text": "già fatto tranquillo"
        }
      ]
    },
    {
      "name": "Silvia",
      "messages": [
        {
          "mine": false,
          "text": "hai visto che offerta sul detersivo al lidl?"
        },
        {
          "mine": true,
          "text": "no dai, conviene?"
        },
        {
          "mine": false,
          "text": "si tre pezzi al prezzo di due"
        },
        {
          "mine": true,
          "text": "allora prendine uno anche a me grazie"
        },
        {
          "mine": false,
          "text": "ok te lo lascio in portineria"
        }
      ]
    },
    {
      "name": "Roberto",
      "messages": [
        {
          "mine": true,
          "text": "ci vediamo al calcetto giovedì?"
        },
        {
          "mine": false,
          "text": "si ma io arrivo un po tardi"
        },
        {
          "mine": true,
          "text": "tranquillo iniziamo a scaldarci"
        },
        {
          "mine": false,
          "text": "ok verso le 19 sono lì"
        },
        {
          "mine": true,
          "text": "perfetto"
        }
      ]
    },
    {
      "name": "Laura",
      "messages": [
        {
          "mine": false,
          "text": "domani sei libera per un pranzo veloce?"
        },
        {
          "mine": true,
          "text": "si ho un buco tra le 12 e le 13"
        },
        {
          "mine": false,
          "text": "perfetto un panino insieme"
        },
        {
          "mine": true,
          "text": "ci sto, da dove al solito"
        },
        {
          "mine": false,
          "text": "ottimo a domani"
        }
      ]
    },
    {
      "name": "Stefano",
      "messages": [
        {
          "mine": true,
          "text": "mi presti il tuo carica batterie?"
        },
        {
          "mine": false,
          "text": "certo quale ti serve?"
        },
        {
          "mine": true,
          "text": "quello del telefono, ho perso il mio"
        },
        {
          "mine": false,
          "text": "te lo porto domani in ufficio"
        },
        {
          "mine": true,
          "text": "grazie sei un grande"
        }
      ]
    },
    {
      "name": "Paola",
      "messages": [
        {
          "mine": false,
          "text": "hai innaffiato le piante di casa mia?"
        },
        {
          "mine": true,
          "text": "si stamattina, sono tutte belle verdi"
        },
        {
          "mine": false,
          "text": "grazie mille, torno domenica"
        },
        {
          "mine": true,
          "text": "tranquilla ci penso io"
        },
        {
          "mine": false,
          "text": "sei salvavita"
        }
      ]
    },
    {
      "name": "Fabio",
      "messages": [
        {
          "mine": true,
          "text": "hai novità sul preventivo della cucina?"
        },
        {
          "mine": false,
          "text": "si arrivato ieri, un po caro"
        },
        {
          "mine": true,
          "text": "quanto?"
        },
        {
          "mine": false,
          "text": "ti giro la mail stasera"
        },
        {
          "mine": true,
          "text": "ok grazie vediamo"
        }
      ]
    },
    {
      "name": "Ilaria",
      "messages": [
        {
          "mine": false,
          "text": "che si fa sabato sera?"
        },
        {
          "mine": true,
          "text": "boh una cena tranquilla?"
        },
        {
          "mine": false,
          "text": "va bene, cucino io se venite da me"
        },
        {
          "mine": true,
          "text": "perfetto porto il vino"
        },
        {
          "mine": false,
          "text": "e io il dolce dai"
        }
      ]
    },
    {
      "name": "Riccardo",
      "messages": [
        {
          "mine": true,
          "text": "domani hai la macchina?"
        },
        {
          "mine": false,
          "text": "si perché ti serve?"
        },
        {
          "mine": true,
          "text": "dovrei portare uno scatolone in cantina"
        },
        {
          "mine": false,
          "text": "passo io dopo cena ti aiuto"
        },
        {
          "mine": true,
          "text": "grazie mille"
        }
      ]
    },
    {
      "name": "Beatrice",
      "messages": [
        {
          "mine": false,
          "text": "il corso di pilates è spostato a giovedì"
        },
        {
          "mine": true,
          "text": "ah ok grazie per l avviso"
        },
        {
          "mine": false,
          "text": "stessa ora però, le 18:30"
        },
        {
          "mine": true,
          "text": "perfetto ci sono"
        },
        {
          "mine": false,
          "text": "ci vediamo lì"
        }
      ]
    },
    {
      "name": "Emanuele",
      "messages": [
        {
          "mine": true,
          "text": "hai per caso il numero del gommista?"
        },
        {
          "mine": false,
          "text": "si te lo mando, è bravo e onesto"
        },
        {
          "mine": true,
          "text": "grazie devo cambiare le gomme invernali"
        },
        {
          "mine": false,
          "text": "chiamalo presto che si riempie"
        },
        {
          "mine": true,
          "text": "ok lo faccio subito"
        }
      ]
    },
    {
      "name": "Zia Rita",
      "messages": [
        {
          "mine": false,
          "text": "amore vieni al pranzo di pasqua?"
        },
        {
          "mine": true,
          "text": "certo zia non mancherei mai"
        },
        {
          "mine": false,
          "text": "porti qualcosa? magari un antipasto"
        },
        {
          "mine": true,
          "text": "si porto io i salumi e il formaggio"
        },
        {
          "mine": false,
          "text": "perfetto ti aspetto"
        }
      ]
    },
    {
      "name": "Zio Piero",
      "messages": [
        {
          "mine": true,
          "text": "zio come stanno le api quest anno?"
        },
        {
          "mine": false,
          "text": "benissimo, tanto miele in arrivo"
        },
        {
          "mine": true,
          "text": "me ne tieni un barattolo?"
        },
        {
          "mine": false,
          "text": "ma certo, anzi te ne do due"
        },
        {
          "mine": true,
          "text": "grande zio grazie"
        }
      ]
    },
    {
      "name": "Cugino Nico",
      "messages": [
        {
          "mine": false,
          "text": "ci vediamo alla partita domenica?"
        },
        {
          "mine": true,
          "text": "si prendo io i biglietti"
        },
        {
          "mine": false,
          "text": "ottimo, poi ti do i soldi del mio"
        },
        {
          "mine": true,
          "text": "tranquillo ci mettiamo d accordo dopo"
        },
        {
          "mine": false,
          "text": "grande a domenica"
        }
      ]
    },
    {
      "name": "Cugina Ele",
      "messages": [
        {
          "mine": true,
          "text": "hai finito il trasloco?"
        },
        {
          "mine": false,
          "text": "quasi, ancora scatoloni ovunque"
        },
        {
          "mine": true,
          "text": "se vuoi vengo a darti una mano"
        },
        {
          "mine": false,
          "text": "ti adoro, sabato pomeriggio?"
        },
        {
          "mine": true,
          "text": "perfetto porto anche i miei guantoni"
        }
      ]
    },
    {
      "name": "Marco l'idraulico",
      "messages": [
        {
          "mine": true,
          "text": "buongiorno, ho un rubinetto che perde"
        },
        {
          "mine": false,
          "text": "buongiorno, posso passare giovedì mattina"
        },
        {
          "mine": true,
          "text": "perfetto verso che ora?"
        },
        {
          "mine": false,
          "text": "diciamo le 9, va bene?"
        },
        {
          "mine": true,
          "text": "ottimo la aspetto grazie"
        }
      ]
    },
    {
      "name": "Giovanni il meccanico",
      "messages": [
        {
          "mine": false,
          "text": "l auto è pronta, era solo la batteria"
        },
        {
          "mine": true,
          "text": "meno male, quanto le devo?"
        },
        {
          "mine": false,
          "text": "ottanta euro tutto compreso"
        },
        {
          "mine": true,
          "text": "ok passo a ritirarla nel pomeriggio"
        },
        {
          "mine": false,
          "text": "va bene, a dopo"
        }
      ]
    },
    {
      "name": "Dottoressa Bianchi",
      "messages": [
        {
          "mine": true,
          "text": "buongiorno vorrei spostare l appuntamento"
        },
        {
          "mine": false,
          "text": "certo, va bene martedì alle 16?"
        },
        {
          "mine": true,
          "text": "perfetto per me"
        },
        {
          "mine": false,
          "text": "bene la segno, a martedì"
        },
        {
          "mine": true,
          "text": "grazie mille buona giornata"
        }
      ]
    },
    {
      "name": "Dentista",
      "messages": [
        {
          "mine": false,
          "text": "le ricordiamo il controllo di domani alle 11"
        },
        {
          "mine": true,
          "text": "grazie confermo la presenza"
        },
        {
          "mine": false,
          "text": "perfetto, la aspettiamo"
        },
        {
          "mine": true,
          "text": "devo portare qualcosa?"
        },
        {
          "mine": false,
          "text": "no solo la tessera, a domani"
        }
      ]
    },
    {
      "name": "Parrucchiere",
      "messages": [
        {
          "mine": true,
          "text": "ciao vorrei fissare taglio e piega"
        },
        {
          "mine": false,
          "text": "ciao! ti va bene venerdì alle 15?"
        },
        {
          "mine": true,
          "text": "perfetto"
        },
        {
          "mine": false,
          "text": "ottimo ti aspetto"
        },
        {
          "mine": true,
          "text": "grazie a venerdì"
        }
      ]
    },
    {
      "name": "Vicina Anna",
      "messages": [
        {
          "mine": false,
          "text": "scusa mi presti un po di zucchero?"
        },
        {
          "mine": true,
          "text": "certo suono io al tuo campanello"
        },
        {
          "mine": false,
          "text": "grazie mille sto facendo una torta"
        },
        {
          "mine": true,
          "text": "figurati, poi me ne dai una fetta ahah"
        },
        {
          "mine": false,
          "text": "assolutamente si!"
        }
      ]
    },
    {
      "name": "Vicino di casa",
      "messages": [
        {
          "mine": true,
          "text": "buonasera ha ricevuto lei un mio pacco?"
        },
        {
          "mine": false,
          "text": "si il corriere me lo ha lasciato oggi"
        },
        {
          "mine": true,
          "text": "meno male grazie, passo a prenderlo"
        },
        {
          "mine": false,
          "text": "quando vuole, sono a casa tutta sera"
        },
        {
          "mine": true,
          "text": "arrivo tra dieci minuti grazie"
        }
      ]
    },
    {
      "name": "Portinaio",
      "messages": [
        {
          "mine": false,
          "text": "è arrivata una raccomandata per lei"
        },
        {
          "mine": true,
          "text": "grazie, passo domani mattina a ritirarla"
        },
        {
          "mine": false,
          "text": "va bene la tengo in guardiola"
        },
        {
          "mine": true,
          "text": "gentilissimo grazie"
        },
        {
          "mine": false,
          "text": "di nulla buona serata"
        }
      ]
    },
    {
      "name": "Collega Sandra",
      "messages": [
        {
          "mine": true,
          "text": "hai finito il report per il capo?"
        },
        {
          "mine": false,
          "text": "quasi, mi manca l ultima tabella"
        },
        {
          "mine": true,
          "text": "se vuoi ti aiuto con i numeri"
        },
        {
          "mine": false,
          "text": "grazie ci vediamo alla macchinetta tra 5"
        },
        {
          "mine": true,
          "text": "arrivo"
        }
      ]
    },
    {
      "name": "Capo",
      "messages": [
        {
          "mine": false,
          "text": "riesci a mandarmi il file entro le 12?"
        },
        {
          "mine": true,
          "text": "si lo sto finendo ora"
        },
        {
          "mine": false,
          "text": "perfetto grazie"
        },
        {
          "mine": true,
          "text": "te lo giro tra mezz ora"
        },
        {
          "mine": false,
          "text": "ottimo lavoro"
        }
      ]
    },
    {
      "name": "Ufficio HR",
      "messages": [
        {
          "mine": true,
          "text": "buongiorno vorrei chiedere le ferie di agosto"
        },
        {
          "mine": false,
          "text": "certo, dal quanto al quanto?"
        },
        {
          "mine": true,
          "text": "dal 10 al 20 agosto"
        },
        {
          "mine": false,
          "text": "va bene le registro, riceverai la conferma"
        },
        {
          "mine": true,
          "text": "perfetto grazie mille"
        }
      ]
    },
    {
      "name": "Team lavoro",
      "messages": [
        {
          "mine": false,
          "text": "ragazzi la call è spostata alle 15"
        },
        {
          "mine": true,
          "text": "ok per me va bene"
        },
        {
          "mine": false,
          "text": "stesso link di sempre"
        },
        {
          "mine": true,
          "text": "perfetto ci sono"
        },
        {
          "mine": false,
          "text": "grazie a tutti"
        }
      ]
    },
    {
      "name": "Palestra",
      "messages": [
        {
          "mine": true,
          "text": "ciao a che ora chiudete oggi?"
        },
        {
          "mine": false,
          "text": "ciao oggi alle 22"
        },
        {
          "mine": true,
          "text": "perfetto vengo verso le 20"
        },
        {
          "mine": false,
          "text": "ti aspettiamo, buon allenamento"
        },
        {
          "mine": true,
          "text": "grazie"
        }
      ]
    },
    {
      "name": "Corso yoga",
      "messages": [
        {
          "mine": false,
          "text": "la lezione di domani è confermata"
        },
        {
          "mine": true,
          "text": "bene, porto il mio tappetino"
        },
        {
          "mine": false,
          "text": "si meglio, ci vediamo alle 19"
        },
        {
          "mine": true,
          "text": "perfetto a domani"
        },
        {
          "mine": false,
          "text": "namaste"
        }
      ]
    },
    {
      "name": "Maestra di Sofia",
      "messages": [
        {
          "mine": false,
          "text": "buongiorno domani gita al museo, ricordi la merenda"
        },
        {
          "mine": true,
          "text": "buongiorno certo, le preparo il panino"
        },
        {
          "mine": false,
          "text": "perfetto e scarpe comode"
        },
        {
          "mine": true,
          "text": "va bene grazie dell avviso"
        },
        {
          "mine": false,
          "text": "buona giornata"
        }
      ]
    },
    {
      "name": "Asilo",
      "messages": [
        {
          "mine": true,
          "text": "buongiorno oggi viene la nonna a prendere leo"
        },
        {
          "mine": false,
          "text": "va bene, ci serve solo il documento"
        },
        {
          "mine": true,
          "text": "ok glielo ricordo"
        },
        {
          "mine": false,
          "text": "perfetto grazie"
        },
        {
          "mine": true,
          "text": "a dopo"
        }
      ]
    },
    {
      "name": "Babysitter",
      "messages": [
        {
          "mine": false,
          "text": "ciao stasera a che ora vi servo?"
        },
        {
          "mine": true,
          "text": "dalle 20 alle 23 circa"
        },
        {
          "mine": false,
          "text": "perfetto sono lì per le 20"
        },
        {
          "mine": true,
          "text": "grazie mille, i bimbi hanno già cenato"
        },
        {
          "mine": false,
          "text": "ok tranquilla a dopo"
        }
      ]
    },
    {
      "name": "Veterinario",
      "messages": [
        {
          "mine": true,
          "text": "buongiorno vorrei un controllo per il gatto"
        },
        {
          "mine": false,
          "text": "certo, giovedì alle 17 le va bene?"
        },
        {
          "mine": true,
          "text": "perfetto, mangia poco da due giorni"
        },
        {
          "mine": false,
          "text": "vediamo giovedì, intanto tienilo al caldo"
        },
        {
          "mine": true,
          "text": "grazie a giovedì"
        }
      ]
    },
    {
      "name": "Toelettatore",
      "messages": [
        {
          "mine": false,
          "text": "il cane è pronto, profumatissimo"
        },
        {
          "mine": true,
          "text": "che bello grazie, passo tra poco"
        },
        {
          "mine": false,
          "text": "va bene ti aspetto"
        },
        {
          "mine": true,
          "text": "gli avete tagliato anche le unghie?"
        },
        {
          "mine": false,
          "text": "si tutto fatto"
        }
      ]
    },
    {
      "name": "Amico Pippo",
      "messages": [
        {
          "mine": true,
          "text": "domenica vieni a fare un giro in bici?"
        },
        {
          "mine": false,
          "text": "si dai, che percorso?"
        },
        {
          "mine": true,
          "text": "il solito lungo il fiume, tranquillo"
        },
        {
          "mine": false,
          "text": "perfetto ci vediamo alle 8 al ponte"
        },
        {
          "mine": true,
          "text": "top porto la camera d aria di scorta"
        }
      ]
    },
    {
      "name": "Teo",
      "messages": [
        {
          "mine": false,
          "text": "hai visto che hanno aperto un nuovo bar?"
        },
        {
          "mine": true,
          "text": "no dai dove?"
        },
        {
          "mine": false,
          "text": "vicino alla piazza, fanno colazioni buonissime"
        },
        {
          "mine": true,
          "text": "domani lo proviamo?"
        },
        {
          "mine": false,
          "text": "ci sto alle 9"
        }
      ]
    },
    {
      "name": "Vale",
      "messages": [
        {
          "mine": true,
          "text": "mi presti quel vestito nero per sabato?"
        },
        {
          "mine": false,
          "text": "certo passa quando vuoi"
        },
        {
          "mine": true,
          "text": "vengo domani dopo il lavoro"
        },
        {
          "mine": false,
          "text": "ok te lo preparo"
        },
        {
          "mine": true,
          "text": "grazie sei la migliore"
        }
      ]
    },
    {
      "name": "Cri",
      "messages": [
        {
          "mine": false,
          "text": "ci vediamo per lo shopping sabato?"
        },
        {
          "mine": true,
          "text": "si mi servono scarpe nuove"
        },
        {
          "mine": false,
          "text": "perfetto andiamo al centro"
        },
        {
          "mine": true,
          "text": "ci troviamo alle 15 all ingresso"
        },
        {
          "mine": false,
          "text": "ok a sabato"
        }
      ]
    },
    {
      "name": "Ludo",
      "messages": [
        {
          "mine": true,
          "text": "come è andato l esame?"
        },
        {
          "mine": false,
          "text": "benissimo preso 28!"
        },
        {
          "mine": true,
          "text": "grandeee complimenti"
        },
        {
          "mine": false,
          "text": "grazie stasera festeggio, vieni?"
        },
        {
          "mine": true,
          "text": "ovvio dove?"
        },
        {
          "mine": false,
          "text": "da me verso le 21"
        }
      ]
    },
    {
      "name": "Fra",
      "messages": [
        {
          "mine": false,
          "text": "mi accompagni domani dal dentista?"
        },
        {
          "mine": true,
          "text": "si a che ora?"
        },
        {
          "mine": false,
          "text": "alle 10, non voglio guidare dopo"
        },
        {
          "mine": true,
          "text": "tranquilla ti aspetto e ti riporto a casa"
        },
        {
          "mine": false,
          "text": "grazie di cuore"
        }
      ]
    },
    {
      "name": "Ale del calcetto",
      "messages": [
        {
          "mine": true,
          "text": "raga si gioca stasera?"
        },
        {
          "mine": false,
          "text": "si siamo in otto, manchi solo tu"
        },
        {
          "mine": true,
          "text": "arrivo, dammi 20 minuti"
        },
        {
          "mine": false,
          "text": "ok campo 2 come sempre"
        },
        {
          "mine": true,
          "text": "perfetto"
        }
      ]
    },
    {
      "name": "Marta",
      "messages": [
        {
          "mine": false,
          "text": "hai tempo per un caffè al volo?"
        },
        {
          "mine": true,
          "text": "si scendo tra cinque minuti"
        },
        {
          "mine": false,
          "text": "ti aspetto al bar sotto l ufficio"
        },
        {
          "mine": true,
          "text": "arrivo"
        },
        {
          "mine": false,
          "text": "ordino io intanto"
        }
      ]
    },
    {
      "name": "Gianni",
      "messages": [
        {
          "mine": true,
          "text": "hai per caso una scala che mi presti?"
        },
        {
          "mine": false,
          "text": "si quella grande o piccola?"
        },
        {
          "mine": true,
          "text": "la grande, devo cambiare una lampadina alta"
        },
        {
          "mine": false,
          "text": "passa pure che è in garage"
        },
        {
          "mine": true,
          "text": "grazie arrivo dopo"
        }
      ]
    },
    {
      "name": "Lorenzo",
      "messages": [
        {
          "mine": false,
          "text": "domani porto io i croissant in ufficio"
        },
        {
          "mine": true,
          "text": "che bello, uno alla crema per me"
        },
        {
          "mine": false,
          "text": "segnato ahah"
        },
        {
          "mine": true,
          "text": "sei un grande grazie"
        },
        {
          "mine": false,
          "text": "a domani"
        }
      ]
    },
    {
      "name": "Camilla",
      "messages": [
        {
          "mine": true,
          "text": "sei riuscita a prenotare il ristorante?"
        },
        {
          "mine": false,
          "text": "si per sabato alle 20:30"
        },
        {
          "mine": true,
          "text": "perfetto siamo in sei giusto?"
        },
        {
          "mine": false,
          "text": "esatto, ho detto tavolo dentro"
        },
        {
          "mine": true,
          "text": "ottimo grazie"
        }
      ]
    },
    {
      "name": "Tommaso",
      "messages": [
        {
          "mine": false,
          "text": "hai finito di leggere quel giallo?"
        },
        {
          "mine": true,
          "text": "si ieri sera, colpo di scena finale"
        },
        {
          "mine": false,
          "text": "me lo presti poi?"
        },
        {
          "mine": true,
          "text": "certo te lo do domani"
        },
        {
          "mine": false,
          "text": "grazie"
        }
      ]
    },
    {
      "name": "Alice",
      "messages": [
        {
          "mine": true,
          "text": "che tempo fa da voi?"
        },
        {
          "mine": false,
          "text": "qui piove da stamattina uff"
        },
        {
          "mine": true,
          "text": "che noia, qui invece c è sole"
        },
        {
          "mine": false,
          "text": "beata te, portami un po di caldo"
        },
        {
          "mine": true,
          "text": "ahaha te lo spedisco"
        }
      ]
    },
    {
      "name": "Filippo",
      "messages": [
        {
          "mine": false,
          "text": "riesci a passare a prendere il pane?"
        },
        {
          "mine": true,
          "text": "si vado io dal panettiere"
        },
        {
          "mine": false,
          "text": "prendi anche due focacce grazie"
        },
        {
          "mine": true,
          "text": "ok, integrale o normale?"
        },
        {
          "mine": false,
          "text": "normale grazie"
        }
      ]
    },
    {
      "name": "Greta",
      "messages": [
        {
          "mine": true,
          "text": "ci vediamo al mercato sabato mattina?"
        },
        {
          "mine": false,
          "text": "si mi servono frutta e verdura"
        },
        {
          "mine": true,
          "text": "perfetto ci troviamo alle 9 al banco del contadino"
        },
        {
          "mine": false,
          "text": "ottimo a sabato"
        },
        {
          "mine": true,
          "text": "porta le borse riutilizzabili"
        }
      ]
    },
    {
      "name": "Edoardo",
      "messages": [
        {
          "mine": false,
          "text": "hai visto la mail dell amministratore?"
        },
        {
          "mine": true,
          "text": "si assemblea condominiale lunedì"
        },
        {
          "mine": false,
          "text": "che palle, ci vai?"
        },
        {
          "mine": true,
          "text": "devo, si parla del tetto"
        },
        {
          "mine": false,
          "text": "ok fammi sapere poi"
        }
      ]
    },
    {
      "name": "Rebecca",
      "messages": [
        {
          "mine": true,
          "text": "come sta il piccolo, la febbre è scesa?"
        },
        {
          "mine": false,
          "text": "si per fortuna stanotte è stato meglio"
        },
        {
          "mine": true,
          "text": "meno male, che spavento"
        },
        {
          "mine": false,
          "text": "oggi resta a casa da scuola"
        },
        {
          "mine": true,
          "text": "giusto, fallo riposare"
        }
      ]
    },
    {
      "name": "Nicola",
      "messages": [
        {
          "mine": false,
          "text": "domani si va a correre?"
        },
        {
          "mine": true,
          "text": "si ma prendiamola piano che sono fuso"
        },
        {
          "mine": false,
          "text": "tranquillo giro corto"
        },
        {
          "mine": true,
          "text": "ok alle 7 al parco"
        },
        {
          "mine": false,
          "text": "perfetto porto la borraccia"
        }
      ]
    },
    {
      "name": "Aurora",
      "messages": [
        {
          "mine": true,
          "text": "hai lo shampoo per capelli secchi che usi tu?"
        },
        {
          "mine": false,
          "text": "si quello alla cheratina, ottimo"
        },
        {
          "mine": true,
          "text": "dove lo compri?"
        },
        {
          "mine": false,
          "text": "in farmacia o al supermercato grande"
        },
        {
          "mine": true,
          "text": "grazie lo cerco"
        }
      ]
    },
    {
      "name": "Leo",
      "messages": [
        {
          "mine": false,
          "text": "papà mi porti al campo di calcio sabato?"
        },
        {
          "mine": true,
          "text": "certo a che ora l allenamento?"
        },
        {
          "mine": false,
          "text": "alle 10"
        },
        {
          "mine": true,
          "text": "ok prepara la borsa la sera prima"
        },
        {
          "mine": false,
          "text": "va bene grazie papà"
        }
      ]
    },
    {
      "name": "Bianca",
      "messages": [
        {
          "mine": true,
          "text": "riesci a tenermi il cane domenica?"
        },
        {
          "mine": false,
          "text": "certo, quanto starete fuori?"
        },
        {
          "mine": true,
          "text": "tutto il giorno, torniamo la sera"
        },
        {
          "mine": false,
          "text": "nessun problema, portami le sue crocchette"
        },
        {
          "mine": true,
          "text": "perfetto grazie di cuore"
        }
      ]
    },
    {
      "name": "Samuele",
      "messages": [
        {
          "mine": false,
          "text": "hai la chiave inglese giusta per i termosifoni?"
        },
        {
          "mine": true,
          "text": "credo di si, che misura?"
        },
        {
          "mine": false,
          "text": "quella per sfiatarli"
        },
        {
          "mine": true,
          "text": "ah si ce l ho, passa a prenderla"
        },
        {
          "mine": false,
          "text": "arrivo tra un po grazie"
        }
      ]
    },
    {
      "name": "Noemi",
      "messages": [
        {
          "mine": true,
          "text": "a che ora ci troviamo domani per il cinema?"
        },
        {
          "mine": false,
          "text": "lo spettacolo è alle 21"
        },
        {
          "mine": true,
          "text": "ci vediamo prima per un panino?"
        },
        {
          "mine": false,
          "text": "si alle 19:30 al fast food vicino"
        },
        {
          "mine": true,
          "text": "perfetto a domani"
        }
      ]
    },
    {
      "name": "Christian",
      "messages": [
        {
          "mine": false,
          "text": "mi dai una mano col trasloco del divano?"
        },
        {
          "mine": true,
          "text": "si quando?"
        },
        {
          "mine": false,
          "text": "sabato mattina, è pesante"
        },
        {
          "mine": true,
          "text": "ci sto, chiamo anche marco così siamo in tre"
        },
        {
          "mine": false,
          "text": "ottima idea grazie"
        }
      ]
    },
    {
      "name": "Vittoria",
      "messages": [
        {
          "mine": true,
          "text": "hai comprato le candeline per la torta?"
        },
        {
          "mine": false,
          "text": "si e anche i palloncini"
        },
        {
          "mine": true,
          "text": "perfetto io porto il gelato"
        },
        {
          "mine": false,
          "text": "ottimo così è tutto pronto per la festa"
        },
        {
          "mine": true,
          "text": "che emozione i suoi 5 anni"
        }
      ]
    },
    {
      "name": "Gabriele",
      "messages": [
        {
          "mine": false,
          "text": "domani lavori da casa o in ufficio?"
        },
        {
          "mine": true,
          "text": "da casa, ho la call lunga"
        },
        {
          "mine": false,
          "text": "ok allora ci sentiamo dopo pranzo"
        },
        {
          "mine": true,
          "text": "perfetto verso le 14"
        },
        {
          "mine": false,
          "text": "ottimo"
        }
      ]
    },
    {
      "name": "Anna Maria",
      "messages": [
        {
          "mine": true,
          "text": "come procede il ricamo della tovaglia?"
        },
        {
          "mine": false,
          "text": "bene, ho quasi finito il bordo"
        },
        {
          "mine": true,
          "text": "sei bravissima, che pazienza"
        },
        {
          "mine": false,
          "text": "grazie, poi te la faccio vedere"
        },
        {
          "mine": true,
          "text": "non vedo l ora"
        }
      ]
    },
    {
      "name": "Zia Carla",
      "messages": [
        {
          "mine": false,
          "text": "tesoro mi aiuti col telefono nuovo?"
        },
        {
          "mine": true,
          "text": "certo zia, cosa non funziona?"
        },
        {
          "mine": false,
          "text": "non trovo le foto dei nipoti"
        },
        {
          "mine": true,
          "text": "passo domenica e sistemiamo tutto"
        },
        {
          "mine": false,
          "text": "grazie sei un tesoro"
        }
      ]
    },
    {
      "name": "Cognata",
      "messages": [
        {
          "mine": true,
          "text": "che regalo facciamo alla mamma per il compleanno?"
        },
        {
          "mine": false,
          "text": "pensavo a una sciarpa o dei fiori"
        },
        {
          "mine": true,
          "text": "una sciarpa è più utile"
        },
        {
          "mine": false,
          "text": "ok scegliamola insieme sabato"
        },
        {
          "mine": true,
          "text": "perfetto ci vediamo in centro"
        }
      ]
    },
    {
      "name": "Suocera",
      "messages": [
        {
          "mine": false,
          "text": "venite a cena domenica? faccio l arrosto"
        },
        {
          "mine": true,
          "text": "volentieri, a che ora?"
        },
        {
          "mine": false,
          "text": "verso l una va bene?"
        },
        {
          "mine": true,
          "text": "perfetto portiamo noi il dolce"
        },
        {
          "mine": false,
          "text": "ottimo vi aspetto"
        }
      ]
    },
    {
      "name": "Suocero",
      "messages": [
        {
          "mine": true,
          "text": "domenica le do una mano in giardino?"
        },
        {
          "mine": false,
          "text": "volentieri, bisogna potare la siepe"
        },
        {
          "mine": true,
          "text": "ok porto io le cesoie buone"
        },
        {
          "mine": false,
          "text": "perfetto ti aspetto verso le 10"
        },
        {
          "mine": true,
          "text": "d accordo a domenica"
        }
      ]
    },
    {
      "name": "Fratello",
      "messages": [
        {
          "mine": false,
          "text": "mi presti la macchina sabato sera?"
        },
        {
          "mine": true,
          "text": "si ma riportamela col pieno"
        },
        {
          "mine": false,
          "text": "certo tranquillo"
        },
        {
          "mine": true,
          "text": "ok le chiavi sono al solito posto"
        },
        {
          "mine": false,
          "text": "grazie fra"
        }
      ]
    },
    {
      "name": "Sorella",
      "messages": [
        {
          "mine": true,
          "text": "hai sentito la mamma oggi?"
        },
        {
          "mine": false,
          "text": "si l ho chiamata a pranzo, sta bene"
        },
        {
          "mine": true,
          "text": "bene, la vado a trovare domani"
        },
        {
          "mine": false,
          "text": "portale le arance che le piacciono"
        },
        {
          "mine": true,
          "text": "buona idea grazie"
        }
      ]
    },
    {
      "name": "Nipote Gaia",
      "messages": [
        {
          "mine": false,
          "text": "zia mi aiuti coi compiti di mate?"
        },
        {
          "mine": true,
          "text": "certo tesoro, quando?"
        },
        {
          "mine": false,
          "text": "oggi pomeriggio?"
        },
        {
          "mine": true,
          "text": "va bene passo alle 16 con la merenda"
        },
        {
          "mine": false,
          "text": "yeee grazie zia"
        }
      ]
    },
    {
      "name": "Corriere",
      "messages": [
        {
          "mine": false,
          "text": "buongiorno consegna pacco oggi tra le 14 e le 18"
        },
        {
          "mine": true,
          "text": "grazie, se non ci sono lo lasci in portineria"
        },
        {
          "mine": false,
          "text": "va bene, firma il portinaio?"
        },
        {
          "mine": true,
          "text": "si è autorizzato grazie"
        },
        {
          "mine": false,
          "text": "perfetto buona giornata"
        }
      ]
    },
    {
      "name": "Farmacia",
      "messages": [
        {
          "mine": true,
          "text": "buongiorno avete lo sciroppo per la tosse?"
        },
        {
          "mine": false,
          "text": "buongiorno si, quale marca preferisce?"
        },
        {
          "mine": true,
          "text": "quello alle erbe se possibile"
        },
        {
          "mine": false,
          "text": "certo glielo teniamo da parte"
        },
        {
          "mine": true,
          "text": "grazie passo nel pomeriggio"
        }
      ]
    },
    {
      "name": "Panettiere",
      "messages": [
        {
          "mine": false,
          "text": "buongiorno ha ancora del pane integrale?"
        },
        {
          "mine": true,
          "text": "si me ne tenga due, arrivo tra poco"
        },
        {
          "mine": false,
          "text": "va bene glieli metto da parte"
        },
        {
          "mine": true,
          "text": "grazie e anche una focaccia"
        },
        {
          "mine": false,
          "text": "perfetto a dopo"
        }
      ]
    },
    {
      "name": "Idraulico Tonino",
      "messages": [
        {
          "mine": true,
          "text": "buonasera lo scarico del lavandino è intasato"
        },
        {
          "mine": false,
          "text": "buonasera, provo a passare domani mattina"
        },
        {
          "mine": true,
          "text": "la ringrazio, a che ora?"
        },
        {
          "mine": false,
          "text": "verso le 8:30 se le va bene"
        },
        {
          "mine": true,
          "text": "perfetto la aspetto"
        }
      ]
    },
    {
      "name": "Elettricista",
      "messages": [
        {
          "mine": false,
          "text": "buongiorno per il quadro elettrico posso mercoledì"
        },
        {
          "mine": true,
          "text": "va bene, salta la corrente in cucina"
        },
        {
          "mine": false,
          "text": "ok porto i pezzi giusti"
        },
        {
          "mine": true,
          "text": "grazie a mercoledì"
        },
        {
          "mine": false,
          "text": "a presto"
        }
      ]
    },
    {
      "name": "Giardiniere",
      "messages": [
        {
          "mine": true,
          "text": "buongiorno quando può tagliare il prato?"
        },
        {
          "mine": false,
          "text": "giovedì mattina se non piove"
        },
        {
          "mine": true,
          "text": "perfetto è cresciuto tanto"
        },
        {
          "mine": false,
          "text": "si vedo, sistemo anche le aiuole"
        },
        {
          "mine": true,
          "text": "ottimo grazie"
        }
      ]
    },
    {
      "name": "Condominio",
      "messages": [
        {
          "mine": false,
          "text": "domani pulizia scale, spostate lo zerbino"
        },
        {
          "mine": true,
          "text": "va bene grazie per l avviso"
        },
        {
          "mine": false,
          "text": "e non lasciate bici nell androne"
        },
        {
          "mine": true,
          "text": "certo la tolgo stasera"
        },
        {
          "mine": false,
          "text": "grazie della collaborazione"
        }
      ]
    },
    {
      "name": "Amministratore",
      "messages": [
        {
          "mine": true,
          "text": "buongiorno quando arriva il rendiconto annuale?"
        },
        {
          "mine": false,
          "text": "entro fine mese lo invio a tutti"
        },
        {
          "mine": true,
          "text": "perfetto grazie"
        },
        {
          "mine": false,
          "text": "ci sarà anche la data dell assemblea"
        },
        {
          "mine": true,
          "text": "ok resto in attesa"
        }
      ]
    },
    {
      "name": "Scuola guida",
      "messages": [
        {
          "mine": false,
          "text": "la guida di domani è confermata alle 17"
        },
        {
          "mine": true,
          "text": "perfetto ci sono"
        },
        {
          "mine": false,
          "text": "oggi ripassa le precedenze"
        },
        {
          "mine": true,
          "text": "va bene, un po mi agito ahah"
        },
        {
          "mine": false,
          "text": "tranquillo andrai benissimo"
        }
      ]
    },
    {
      "name": "Compagno di squadra",
      "messages": [
        {
          "mine": true,
          "text": "allenamento confermato stasera?"
        },
        {
          "mine": false,
          "text": "si alle 20 al palazzetto"
        },
        {
          "mine": true,
          "text": "ok porto le magliette nuove"
        },
        {
          "mine": false,
          "text": "grande, il mister ci vuole puntuali"
        },
        {
          "mine": true,
          "text": "arrivo prima allora"
        }
      ]
    },
    {
      "name": "Vicina Rosa",
      "messages": [
        {
          "mine": false,
          "text": "scusa mi ritiri tu la posta questa settimana?"
        },
        {
          "mine": true,
          "text": "certo signora Rosa, tranquilla"
        },
        {
          "mine": false,
          "text": "grazie sono dai miei figli qualche giorno"
        },
        {
          "mine": true,
          "text": "le tengo tutto io, buon viaggio"
        },
        {
          "mine": false,
          "text": "sei un tesoro grazie"
        }
      ]
    },
    {
      "name": "Mamma di Luca",
      "messages": [
        {
          "mine": true,
          "text": "ciao domani porto io i bimbi al parco, va bene?"
        },
        {
          "mine": false,
          "text": "perfetto, luca è felicissimo"
        },
        {
          "mine": true,
          "text": "ci troviamo alle 15 all altalena"
        },
        {
          "mine": false,
          "text": "ottimo, porto la merenda per tutti"
        },
        {
          "mine": true,
          "text": "grazie a domani"
        }
      ]
    },
    {
      "name": "Barbiere",
      "messages": [
        {
          "mine": false,
          "text": "ciao vuoi il solito appuntamento del sabato?"
        },
        {
          "mine": true,
          "text": "si ma questa settimana meglio venerdì"
        },
        {
          "mine": false,
          "text": "ok venerdì alle 18 va bene?"
        },
        {
          "mine": true,
          "text": "perfetto, taglio e barba"
        },
        {
          "mine": false,
          "text": "segnato a venerdì"
        }
      ]
    }
  ],
  "pt": [
    {
      "name": "Mãe",
      "messages": [
        {
          "mine": false,
          "text": "ja compraste o pao?"
        },
        {
          "mine": true,
          "text": "ainda nao, passo na padaria a vinda do trabalho"
        },
        {
          "mine": false,
          "text": "traz tb leite se der, acabou"
        },
        {
          "mine": true,
          "text": "ok, meio gordo?"
        },
        {
          "mine": false,
          "text": "sim esse mesmo. obrigada filho"
        },
        {
          "mine": true,
          "text": "de nada, chego por volta das 7"
        }
      ]
    },
    {
      "name": "Pai",
      "messages": [
        {
          "mine": true,
          "text": "pai, o carro faz um barulho estranho quando travo"
        },
        {
          "mine": false,
          "text": "que tipo de barulho? tipo metal?"
        },
        {
          "mine": true,
          "text": "sim mais ou menos, chia"
        },
        {
          "mine": false,
          "text": "deve ser as pastilhas. leva ao toni amanha"
        },
        {
          "mine": true,
          "text": "ta bem, ligo-lhe de manha"
        }
      ]
    },
    {
      "name": "Avó",
      "messages": [
        {
          "mine": false,
          "text": "vens almocar domingo?"
        },
        {
          "mine": true,
          "text": "vou sim avó, levo a sobremesa"
        },
        {
          "mine": false,
          "text": "otimo faco arroz de pato"
        },
        {
          "mine": true,
          "text": "ai adoro, que horas?"
        },
        {
          "mine": false,
          "text": "por volta do meio dia e meia"
        },
        {
          "mine": true,
          "text": "combinado, um beijinho"
        }
      ]
    },
    {
      "name": "Avô",
      "messages": [
        {
          "mine": true,
          "text": "avô o jogo é a que horas hoje?"
        },
        {
          "mine": false,
          "text": "as 8 e um quarto, na sic"
        },
        {
          "mine": true,
          "text": "boa vou tentar ver"
        },
        {
          "mine": false,
          "text": "traz amendoins se vieres ca"
        },
        {
          "mine": true,
          "text": "levo, ate logo"
        }
      ]
    },
    {
      "name": "Ana",
      "messages": [
        {
          "mine": false,
          "text": "queres ir tomar cafe amanha de manha?"
        },
        {
          "mine": true,
          "text": "quero, aquele pe da rotunda?"
        },
        {
          "mine": false,
          "text": "sim as 10?"
        },
        {
          "mine": true,
          "text": "por mim ta, so nao me atraso desta vez rs"
        },
        {
          "mine": false,
          "text": "ja nao acredito nisso rs ate amanha"
        }
      ]
    },
    {
      "name": "João o canalizador",
      "messages": [
        {
          "mine": true,
          "text": "boa tarde, a torneira da cozinha continua a pingar"
        },
        {
          "mine": false,
          "text": "boa tarde. posso passar quinta de manha"
        },
        {
          "mine": true,
          "text": "quinta serve, a partir das 9 estou em casa"
        },
        {
          "mine": false,
          "text": "combinado, levo uma vedante nova"
        },
        {
          "mine": true,
          "text": "obrigado, ate quinta"
        }
      ]
    },
    {
      "name": "Rita",
      "messages": [
        {
          "mine": false,
          "text": "viste que fecharam aquela loja da roupa?"
        },
        {
          "mine": true,
          "text": "a serio? aquela que gostavas?"
        },
        {
          "mine": false,
          "text": "essa mesma, que pena"
        },
        {
          "mine": true,
          "text": "ha saldos noutra ao pe, podemos ir ver"
        },
        {
          "mine": false,
          "text": "boa ideia, sabado?"
        },
        {
          "mine": true,
          "text": "sabado de tarde entao"
        }
      ]
    },
    {
      "name": "Tiago",
      "messages": [
        {
          "mine": true,
          "text": "conseguiste os bilhetes pro cinema?"
        },
        {
          "mine": false,
          "text": "sim, sessao das 21h30"
        },
        {
          "mine": true,
          "text": "fixe, encontramo-nos la 15 min antes?"
        },
        {
          "mine": false,
          "text": "boa, quero pipocas doces desta vez"
        },
        {
          "mine": true,
          "text": "combinado eu chego cedo e trato"
        }
      ]
    },
    {
      "name": "Sofia",
      "messages": [
        {
          "mine": false,
          "text": "esqueci-me do guarda chuva ai em tua casa"
        },
        {
          "mine": true,
          "text": "ta aqui no cabide, guardo pra ti"
        },
        {
          "mine": false,
          "text": "obrigada, passo amanha a buscar"
        },
        {
          "mine": true,
          "text": "sem stress, ta bem guardado"
        }
      ]
    },
    {
      "name": "Miguel",
      "messages": [
        {
          "mine": true,
          "text": "vais ao ginasio hoje?"
        },
        {
          "mine": false,
          "text": "vou depois das 6, vens?"
        },
        {
          "mine": true,
          "text": "vou tentar, saio tarde do trabalho"
        },
        {
          "mine": false,
          "text": "se nao der amanha entao"
        },
        {
          "mine": true,
          "text": "sim amanha é mais seguro"
        }
      ]
    },
    {
      "name": "Inês",
      "messages": [
        {
          "mine": false,
          "text": "que receita usaste pro bolo de cenoura?"
        },
        {
          "mine": true,
          "text": "e a normal, mando-te a foto do caderno"
        },
        {
          "mine": false,
          "text": "obrigada! ficou tao fofo"
        },
        {
          "mine": true,
          "text": "o segredo e nao bater demais a massa"
        },
        {
          "mine": false,
          "text": "ah boa dica, vou tentar"
        }
      ]
    },
    {
      "name": "Pedro",
      "messages": [
        {
          "mine": true,
          "text": "podes-me emprestar a berbequim no fim de semana?"
        },
        {
          "mine": false,
          "text": "posso, so preciso dela domingo a tarde"
        },
        {
          "mine": true,
          "text": "eu devolvo sabado a noite entao"
        },
        {
          "mine": false,
          "text": "perfeito, passa quando quiseres"
        }
      ]
    },
    {
      "name": "Catarina",
      "messages": [
        {
          "mine": false,
          "text": "a que horas abre o centro comercial ao domingo?"
        },
        {
          "mine": true,
          "text": "acho que as 10, mas confirma"
        },
        {
          "mine": false,
          "text": "queria ir cedo pra evitar fila"
        },
        {
          "mine": true,
          "text": "boa ideia, avisa se fores que talvez va tb"
        },
        {
          "mine": false,
          "text": "combinado, mando msg quando sair"
        }
      ]
    },
    {
      "name": "Bruno",
      "messages": [
        {
          "mine": true,
          "text": "o comboio das 8 esta atrasado?"
        },
        {
          "mine": false,
          "text": "ta 10 min, acabei de ver no painel"
        },
        {
          "mine": true,
          "text": "bolas, vou perder a ligacao"
        },
        {
          "mine": false,
          "text": "apanha o proximo, ha um as 8h25"
        },
        {
          "mine": true,
          "text": "pois, tem de ser. obrigado"
        }
      ]
    },
    {
      "name": "Marta",
      "messages": [
        {
          "mine": false,
          "text": "trouxeste o livro que te emprestei?"
        },
        {
          "mine": true,
          "text": "ai desculpa esqueci outra vez"
        },
        {
          "mine": false,
          "text": "rs sem pressa, so nao te esquecas"
        },
        {
          "mine": true,
          "text": "amanha ponho ja na mochila prometo"
        }
      ]
    },
    {
      "name": "Rui",
      "messages": [
        {
          "mine": true,
          "text": "jantar de sexta continua de pe?"
        },
        {
          "mine": false,
          "text": "sim, reservei mesa pras 8"
        },
        {
          "mine": true,
          "text": "quantos vamos ser?"
        },
        {
          "mine": false,
          "text": "seis, ainda falta confirmar o pedro"
        },
        {
          "mine": true,
          "text": "eu falo com ele hoje"
        }
      ]
    },
    {
      "name": "Beatriz",
      "messages": [
        {
          "mine": false,
          "text": "a tua filha tb tem festa de anos sabado?"
        },
        {
          "mine": true,
          "text": "tem, da colega da escola"
        },
        {
          "mine": false,
          "text": "a minha tambem, podemos ir juntas"
        },
        {
          "mine": true,
          "text": "boa, damos boleia uma a outra"
        },
        {
          "mine": false,
          "text": "combinado, eu conduzo a ida"
        }
      ]
    },
    {
      "name": "André",
      "messages": [
        {
          "mine": true,
          "text": "sabes se ha jogo na tv hoje?"
        },
        {
          "mine": false,
          "text": "ha sim, as 20h45"
        },
        {
          "mine": true,
          "text": "vou ai ver contigo?"
        },
        {
          "mine": false,
          "text": "vem, trago cerveja"
        },
        {
          "mine": true,
          "text": "eu levo tremocos"
        }
      ]
    },
    {
      "name": "Carla",
      "messages": [
        {
          "mine": false,
          "text": "a reuniao passou pras 3 da tarde"
        },
        {
          "mine": true,
          "text": "ok obrigada por avisar"
        },
        {
          "mine": false,
          "text": "e na sala 2 desta vez"
        },
        {
          "mine": true,
          "text": "anotado, levo o portatil"
        }
      ]
    },
    {
      "name": "Nuno",
      "messages": [
        {
          "mine": true,
          "text": "encontraste as chaves?"
        },
        {
          "mine": false,
          "text": "estavam no bolso do casaco afinal"
        },
        {
          "mine": true,
          "text": "ainda bem, ja estava a ficar preocupado"
        },
        {
          "mine": false,
          "text": "eu tb rs, procurei a casa toda"
        }
      ]
    },
    {
      "name": "Sara",
      "messages": [
        {
          "mine": false,
          "text": "que tempo esta ai? aqui chove imenso"
        },
        {
          "mine": true,
          "text": "aqui so nublado por agora"
        },
        {
          "mine": false,
          "text": "leva casaco entao, vem ai chuva"
        },
        {
          "mine": true,
          "text": "ja meti na mala, obrigada"
        }
      ]
    },
    {
      "name": "Ricardo",
      "messages": [
        {
          "mine": true,
          "text": "consegues trocar de turno comigo na sexta?"
        },
        {
          "mine": false,
          "text": "posso, mas ficas com o meu de sabado"
        },
        {
          "mine": true,
          "text": "combinado, obrigado mesmo"
        },
        {
          "mine": false,
          "text": "de nada, avisa a chefe"
        },
        {
          "mine": true,
          "text": "vou mandar email agora"
        }
      ]
    },
    {
      "name": "Joana",
      "messages": [
        {
          "mine": false,
          "text": "recebeste a encomenda?"
        },
        {
          "mine": true,
          "text": "recebi, chegou hoje de manha"
        },
        {
          "mine": false,
          "text": "boa, veio tudo certo?"
        },
        {
          "mine": true,
          "text": "veio sim, a caixa e maior do que pensava rs"
        },
        {
          "mine": false,
          "text": "epa ainda bem"
        }
      ]
    },
    {
      "name": "Diogo",
      "messages": [
        {
          "mine": true,
          "text": "vais buscar os miudos a escola hoje?"
        },
        {
          "mine": false,
          "text": "vou, saio mais cedo"
        },
        {
          "mine": true,
          "text": "boa, eu faco o jantar entao"
        },
        {
          "mine": false,
          "text": "faz aquela massa que eles gostam"
        },
        {
          "mine": true,
          "text": "ta feito"
        }
      ]
    },
    {
      "name": "Mariana",
      "messages": [
        {
          "mine": false,
          "text": "a que horas e a consulta do dentista amanha?"
        },
        {
          "mine": true,
          "text": "as 11h30"
        },
        {
          "mine": false,
          "text": "queres boleia?"
        },
        {
          "mine": true,
          "text": "se puderes agradeco, o carro ta na oficina"
        },
        {
          "mine": false,
          "text": "passo por ti as 11"
        }
      ]
    },
    {
      "name": "Filipe",
      "messages": [
        {
          "mine": true,
          "text": "compraste as pilhas pro comando?"
        },
        {
          "mine": false,
          "text": "esqueci, ponho na lista pra amanha"
        },
        {
          "mine": true,
          "text": "ok sem pressa, so o comando da tv"
        },
        {
          "mine": false,
          "text": "as AA certo?"
        },
        {
          "mine": true,
          "text": "sim essas"
        }
      ]
    },
    {
      "name": "Patrícia",
      "messages": [
        {
          "mine": false,
          "text": "vamos ao mercado sabado de manha?"
        },
        {
          "mine": true,
          "text": "vamos, precisamos de fruta e legumes"
        },
        {
          "mine": false,
          "text": "e queria peixe fresco"
        },
        {
          "mine": true,
          "text": "boa, vamos cedo que fica melhor"
        },
        {
          "mine": false,
          "text": "as 9 passo por ti"
        }
      ]
    },
    {
      "name": "Hugo",
      "messages": [
        {
          "mine": true,
          "text": "o wifi ta a funcionar ai?"
        },
        {
          "mine": false,
          "text": "ta lento hoje, ja reiniciei o router"
        },
        {
          "mine": true,
          "text": "aqui tb, deve ser da operadora"
        },
        {
          "mine": false,
          "text": "se continuar ligo pra la amanha"
        }
      ]
    },
    {
      "name": "Vera",
      "messages": [
        {
          "mine": false,
          "text": "queres vir jantar ca em casa domingo?"
        },
        {
          "mine": true,
          "text": "quero, levo o vinho"
        },
        {
          "mine": false,
          "text": "faco lasanha"
        },
        {
          "mine": true,
          "text": "boa, adoro a tua lasanha"
        },
        {
          "mine": false,
          "text": "ate domingo entao, por volta das 8"
        }
      ]
    },
    {
      "name": "Gonçalo",
      "messages": [
        {
          "mine": true,
          "text": "a que horas jogamos futebol quinta?"
        },
        {
          "mine": false,
          "text": "reservei o campo pras 9 da noite"
        },
        {
          "mine": true,
          "text": "boa, somos quantos?"
        },
        {
          "mine": false,
          "text": "10, ta cheio"
        },
        {
          "mine": true,
          "text": "fixe, levo as coletes"
        }
      ]
    },
    {
      "name": "Cláudia",
      "messages": [
        {
          "mine": false,
          "text": "podes regar as minhas plantas enquanto estou fora?"
        },
        {
          "mine": true,
          "text": "posso, quantos dias?"
        },
        {
          "mine": false,
          "text": "so ate quarta, deixo a chave debaixo do tapete"
        },
        {
          "mine": true,
          "text": "ta bem, rego dia sim dia nao"
        },
        {
          "mine": false,
          "text": "obrigada, ficas a dever nada"
        }
      ]
    },
    {
      "name": "Fábio",
      "messages": [
        {
          "mine": true,
          "text": "acabou o gas la em casa?"
        },
        {
          "mine": false,
          "text": "acabou, ja pedi botija nova"
        },
        {
          "mine": true,
          "text": "boa, quando chega?"
        },
        {
          "mine": false,
          "text": "amanha de manha disseram"
        }
      ]
    },
    {
      "name": "Susana",
      "messages": [
        {
          "mine": false,
          "text": "que prenda levamos pro anos da avó?"
        },
        {
          "mine": true,
          "text": "ela gostava daquele xaile azul"
        },
        {
          "mine": false,
          "text": "boa ideia, divido contigo?"
        },
        {
          "mine": true,
          "text": "claro, eu compro e depois acertamos"
        },
        {
          "mine": false,
          "text": "combinado"
        }
      ]
    },
    {
      "name": "Vasco",
      "messages": [
        {
          "mine": true,
          "text": "acabaste o relatorio?"
        },
        {
          "mine": false,
          "text": "quase, falta a ultima parte"
        },
        {
          "mine": true,
          "text": "precisas de ajuda?"
        },
        {
          "mine": false,
          "text": "se reveres a introducao ajuda"
        },
        {
          "mine": true,
          "text": "manda ca que eu leio"
        }
      ]
    },
    {
      "name": "Helena",
      "messages": [
        {
          "mine": false,
          "text": "a marcacao no cabeleireiro ficou pra quando?"
        },
        {
          "mine": true,
          "text": "sabado as 10 com o nelson"
        },
        {
          "mine": false,
          "text": "so corte ou tb pintar?"
        },
        {
          "mine": true,
          "text": "corte e pintar, vai demorar"
        },
        {
          "mine": false,
          "text": "leva um livro entao rs"
        }
      ]
    },
    {
      "name": "Zé",
      "messages": [
        {
          "mine": true,
          "text": "vamos apanhar boleia juntos amanha?"
        },
        {
          "mine": false,
          "text": "boa, passo por ti as 7h45"
        },
        {
          "mine": true,
          "text": "espero la em baixo"
        },
        {
          "mine": false,
          "text": "traz troco pra portagem se tiveres"
        },
        {
          "mine": true,
          "text": "levo"
        }
      ]
    },
    {
      "name": "Teresa",
      "messages": [
        {
          "mine": false,
          "text": "o gato comeu hoje? deixei a racao pronta"
        },
        {
          "mine": true,
          "text": "comeu tudo, ate pediu mais rs"
        },
        {
          "mine": false,
          "text": "ai esse guloso, nao dês mais"
        },
        {
          "mine": true,
          "text": "nao dou, ta descansada"
        }
      ]
    },
    {
      "name": "Manel",
      "messages": [
        {
          "mine": true,
          "text": "tens a escada em casa? preciso mudar uma lampada"
        },
        {
          "mine": false,
          "text": "tenho, passa a buscar quando quiseres"
        },
        {
          "mine": true,
          "text": "vou ai logo a noite"
        },
        {
          "mine": false,
          "text": "ta aqui na garagem"
        }
      ]
    },
    {
      "name": "Cristina",
      "messages": [
        {
          "mine": false,
          "text": "que horas te dá jeito para o almoço de equipa?"
        },
        {
          "mine": true,
          "text": "por volta das 13h esta bem"
        },
        {
          "mine": false,
          "text": "reservo naquele restaurante do costume?"
        },
        {
          "mine": true,
          "text": "sim, gostam todos de la"
        },
        {
          "mine": false,
          "text": "ok reservo pra 8 pessoas"
        }
      ]
    },
    {
      "name": "Luís",
      "messages": [
        {
          "mine": true,
          "text": "o autocarro 704 ainda passa a esta hora?"
        },
        {
          "mine": false,
          "text": "passa sim, mas de 30 em 30 min"
        },
        {
          "mine": true,
          "text": "bolas acabei de perder um"
        },
        {
          "mine": false,
          "text": "vem a pé até a proxima que apanhas melhor"
        },
        {
          "mine": true,
          "text": "boa ideia"
        }
      ]
    },
    {
      "name": "Raquel",
      "messages": [
        {
          "mine": false,
          "text": "trazes a maquina de fazer sumos amanha?"
        },
        {
          "mine": true,
          "text": "trago, ta na caixa da cozinha"
        },
        {
          "mine": false,
          "text": "obrigada, prometo devolver rapido"
        },
        {
          "mine": true,
          "text": "sem pressa, quase nao uso"
        }
      ]
    },
    {
      "name": "Tio Carlos",
      "messages": [
        {
          "mine": true,
          "text": "tio, vais a festa de familia no sabado?"
        },
        {
          "mine": false,
          "text": "vou sim, levo o churrasco"
        },
        {
          "mine": true,
          "text": "boa, eu levo as bebidas"
        },
        {
          "mine": false,
          "text": "combinado, comeca as 13h"
        },
        {
          "mine": true,
          "text": "la estarei"
        }
      ]
    },
    {
      "name": "Tia Fernanda",
      "messages": [
        {
          "mine": false,
          "text": "podes-me dar a receita das filhoses?"
        },
        {
          "mine": true,
          "text": "posso, e a da tua avó"
        },
        {
          "mine": false,
          "text": "essas ficam sempre otimas"
        },
        {
          "mine": true,
          "text": "escrevo e mando amanha"
        },
        {
          "mine": false,
          "text": "obrigada querida"
        }
      ]
    },
    {
      "name": "Prima Alice",
      "messages": [
        {
          "mine": true,
          "text": "vens ca passar o fim de semana?"
        },
        {
          "mine": false,
          "text": "adorava, mas trabalho sabado"
        },
        {
          "mine": true,
          "text": "entao vem domingo so"
        },
        {
          "mine": false,
          "text": "boa, apanho o comboio da manha"
        },
        {
          "mine": true,
          "text": "vou buscar te a estacao"
        }
      ]
    },
    {
      "name": "Primo Ivo",
      "messages": [
        {
          "mine": false,
          "text": "ainda tens a minha consola?"
        },
        {
          "mine": true,
          "text": "tenho, esqueci de te devolver"
        },
        {
          "mine": false,
          "text": "rs sem stress, quando vieres ca"
        },
        {
          "mine": true,
          "text": "levo no proximo almoco de familia"
        }
      ]
    },
    {
      "name": "Vizinha Dona Lurdes",
      "messages": [
        {
          "mine": false,
          "text": "importa-se de receber uma encomenda minha? estou fora"
        },
        {
          "mine": true,
          "text": "claro que nao, deixe o estafeta ca"
        },
        {
          "mine": false,
          "text": "muito obrigada, venho buscar a noite"
        },
        {
          "mine": true,
          "text": "esta a vontade, fica ca em casa"
        }
      ]
    },
    {
      "name": "Sr. Almeida",
      "messages": [
        {
          "mine": true,
          "text": "bom dia, o elevador voltou a avariar"
        },
        {
          "mine": false,
          "text": "bom dia, ja avisei a empresa"
        },
        {
          "mine": true,
          "text": "obrigado, so pra saber se sabiam"
        },
        {
          "mine": false,
          "text": "vem ca amanha de manha arranjar"
        },
        {
          "mine": true,
          "text": "ainda bem, boa semana"
        }
      ]
    },
    {
      "name": "Dentista Dra. Sousa",
      "messages": [
        {
          "mine": false,
          "text": "lembrete: consulta amanha as 15h"
        },
        {
          "mine": true,
          "text": "confirmado, obrigado"
        },
        {
          "mine": false,
          "text": "traga o resultado do raio x se tiver"
        },
        {
          "mine": true,
          "text": "levo, ate amanha"
        }
      ]
    },
    {
      "name": "Cabeleireiro Nelson",
      "messages": [
        {
          "mine": true,
          "text": "consigo remarcar de sexta para sabado?"
        },
        {
          "mine": false,
          "text": "consigo, sabado as 11 esta livre"
        },
        {
          "mine": true,
          "text": "perfeito, obrigado"
        },
        {
          "mine": false,
          "text": "fica marcado entao, ate sabado"
        }
      ]
    },
    {
      "name": "Mecânico Toni",
      "messages": [
        {
          "mine": true,
          "text": "o carro ficou pronto?"
        },
        {
          "mine": false,
          "text": "ficou, so troquei as pastilhas da frente"
        },
        {
          "mine": true,
          "text": "quanto ficou?"
        },
        {
          "mine": false,
          "text": "digo-lhe ao balcao, mas foi barato"
        },
        {
          "mine": true,
          "text": "otimo, passo la ao fim da tarde"
        }
      ]
    },
    {
      "name": "Explicadora Dulce",
      "messages": [
        {
          "mine": false,
          "text": "o tomás melhorou muito a matematica esta semana"
        },
        {
          "mine": true,
          "text": "que bom ouvir isso, obrigada"
        },
        {
          "mine": false,
          "text": "so precisa treinar mais as fracoes"
        },
        {
          "mine": true,
          "text": "vou ajudar em casa com isso"
        },
        {
          "mine": false,
          "text": "combinado, ate quarta"
        }
      ]
    },
    {
      "name": "Professora do Tomás",
      "messages": [
        {
          "mine": true,
          "text": "boa tarde, o tomás pode faltar sexta? consulta"
        },
        {
          "mine": false,
          "text": "boa tarde, sim sem problema"
        },
        {
          "mine": true,
          "text": "obrigada, ele repoe os trabalhos"
        },
        {
          "mine": false,
          "text": "eu mando o que fizermos na aula"
        },
        {
          "mine": true,
          "text": "agradeço imenso"
        }
      ]
    },
    {
      "name": "Babysitter Kika",
      "messages": [
        {
          "mine": false,
          "text": "a que horas precisa de mim sabado?"
        },
        {
          "mine": true,
          "text": "das 8 da noite ate a meia noite mais ou menos"
        },
        {
          "mine": false,
          "text": "certo, os miudos jantam antes?"
        },
        {
          "mine": true,
          "text": "sim jantam, so os por na cama as 9"
        },
        {
          "mine": false,
          "text": "combinado, ate sabado"
        }
      ]
    },
    {
      "name": "Grupo condomínio (Sr. Joaquim)",
      "messages": [
        {
          "mine": false,
          "text": "lembrete: reuniao de condominio quinta as 19h"
        },
        {
          "mine": true,
          "text": "obrigado, vou tentar estar"
        },
        {
          "mine": false,
          "text": "e sobre a pintura das escadas"
        },
        {
          "mine": true,
          "text": "ha ha, ja precisava"
        },
        {
          "mine": false,
          "text": "ate quinta entao"
        }
      ]
    },
    {
      "name": "Padaria da esquina",
      "messages": [
        {
          "mine": true,
          "text": "bom dia, tem daquele pao de agua ainda?"
        },
        {
          "mine": false,
          "text": "bom dia, temos sim, acabado de sair"
        },
        {
          "mine": true,
          "text": "guarde me 4 se puder, passo em 10 min"
        },
        {
          "mine": false,
          "text": "fica guardado"
        }
      ]
    },
    {
      "name": "Estafeta CTT",
      "messages": [
        {
          "mine": false,
          "text": "entrega hoje entre as 14h e as 18h"
        },
        {
          "mine": true,
          "text": "ok vou estar em casa"
        },
        {
          "mine": false,
          "text": "se nao estiver deixo no ponto de recolha"
        },
        {
          "mine": true,
          "text": "melhor entregar em casa, aguardo"
        }
      ]
    },
    {
      "name": "Veterinária Dra. Pinto",
      "messages": [
        {
          "mine": true,
          "text": "a vacina do cao e este mes certo?"
        },
        {
          "mine": false,
          "text": "sim, esta na altura do reforco"
        },
        {
          "mine": true,
          "text": "consigo marcar pra sabado?"
        },
        {
          "mine": false,
          "text": "sabado as 10h30 esta livre"
        },
        {
          "mine": true,
          "text": "otimo, marque por favor"
        }
      ]
    },
    {
      "name": "Colega Márcio",
      "messages": [
        {
          "mine": false,
          "text": "trazes o carregador que te emprestei?"
        },
        {
          "mine": true,
          "text": "trago, ta na minha secretaria"
        },
        {
          "mine": false,
          "text": "obrigado, o meu foi se abaixo"
        },
        {
          "mine": true,
          "text": "amanha entrego"
        }
      ]
    },
    {
      "name": "Chefe Sandra",
      "messages": [
        {
          "mine": true,
          "text": "posso sair meia hora mais cedo hoje?"
        },
        {
          "mine": false,
          "text": "pode, esta tudo tratado?"
        },
        {
          "mine": true,
          "text": "sim entreguei tudo"
        },
        {
          "mine": false,
          "text": "entao sem problema, bom fim de semana"
        },
        {
          "mine": true,
          "text": "igualmente, obrigado"
        }
      ]
    },
    {
      "name": "Óscar do trabalho",
      "messages": [
        {
          "mine": false,
          "text": "vamos almoçar fora hoje?"
        },
        {
          "mine": true,
          "text": "boa, aquele self service?"
        },
        {
          "mine": false,
          "text": "sim, encontramo nos as 13h la em baixo"
        },
        {
          "mine": true,
          "text": "combinado"
        }
      ]
    },
    {
      "name": "Dona Amélia",
      "messages": [
        {
          "mine": true,
          "text": "bom dia, ainda tem ovos caseiros?"
        },
        {
          "mine": false,
          "text": "tenho sim, meia duzia?"
        },
        {
          "mine": true,
          "text": "uma duzia se puder"
        },
        {
          "mine": false,
          "text": "guardo, passe quando quiser"
        },
        {
          "mine": true,
          "text": "vou ai a tarde, obrigado"
        }
      ]
    },
    {
      "name": "Renata",
      "messages": [
        {
          "mine": false,
          "text": "achas que vai chover no piquenique domingo?"
        },
        {
          "mine": true,
          "text": "vi a previsao, sol o dia todo"
        },
        {
          "mine": false,
          "text": "boa, entao confirmamos"
        },
        {
          "mine": true,
          "text": "levo a manta e as sandes"
        },
        {
          "mine": false,
          "text": "eu levo a fruta e o sumo"
        }
      ]
    },
    {
      "name": "Sérgio",
      "messages": [
        {
          "mine": true,
          "text": "podes me ajudar a mudar o sofá sabado?"
        },
        {
          "mine": false,
          "text": "posso, de manha ou de tarde?"
        },
        {
          "mine": true,
          "text": "de manha e melhor, umas 10?"
        },
        {
          "mine": false,
          "text": "ta, levo luvas"
        },
        {
          "mine": true,
          "text": "obrigado, pago te um cafe rs"
        }
      ]
    },
    {
      "name": "Alexandre",
      "messages": [
        {
          "mine": false,
          "text": "esqueci onde estacionei no centro comercial"
        },
        {
          "mine": true,
          "text": "rs olha o bilhete, tem o piso"
        },
        {
          "mine": false,
          "text": "ah e verdade, piso 3 setor B"
        },
        {
          "mine": true,
          "text": "boa, la esta"
        }
      ]
    },
    {
      "name": "Cátia",
      "messages": [
        {
          "mine": true,
          "text": "vais ao curso de culinaria hoje?"
        },
        {
          "mine": false,
          "text": "vou, e sobremesas hoje"
        },
        {
          "mine": true,
          "text": "que inveja, guarda me uma"
        },
        {
          "mine": false,
          "text": "rs faco em casa depois pra ti"
        },
        {
          "mine": true,
          "text": "adoro te"
        }
      ]
    },
    {
      "name": "Duarte",
      "messages": [
        {
          "mine": false,
          "text": "o jogo dos miudos e a que horas?"
        },
        {
          "mine": true,
          "text": "as 10 da manha, no campo de sempre"
        },
        {
          "mine": false,
          "text": "levas tu ou eu?"
        },
        {
          "mine": true,
          "text": "levo eu, tu trazes de volta?"
        },
        {
          "mine": false,
          "text": "combinado"
        }
      ]
    },
    {
      "name": "Leonor",
      "messages": [
        {
          "mine": true,
          "text": "compraste papel higienico? acho que acabou"
        },
        {
          "mine": false,
          "text": "comprei ontem, ta no armario da casa de banho"
        },
        {
          "mine": true,
          "text": "ah nao vi, obrigado"
        },
        {
          "mine": false,
          "text": "ta na prateleira de cima"
        }
      ]
    },
    {
      "name": "Bernardo",
      "messages": [
        {
          "mine": false,
          "text": "vamos correr amanha de manha?"
        },
        {
          "mine": true,
          "text": "vamos, as 7 no parque?"
        },
        {
          "mine": false,
          "text": "as 7 e cedo demais, 7h30?"
        },
        {
          "mine": true,
          "text": "ta bem, 7h30 no portao"
        },
        {
          "mine": false,
          "text": "combinado, nao faltes rs"
        }
      ]
    },
    {
      "name": "Matilde",
      "messages": [
        {
          "mine": true,
          "text": "achas este vestido bom pro casamento?"
        },
        {
          "mine": false,
          "text": "mostra a foto"
        },
        {
          "mine": true,
          "text": "ja mandei, o azul"
        },
        {
          "mine": false,
          "text": "esse fica te otimo, leva esse"
        },
        {
          "mine": true,
          "text": "obrigada, tava indecisa"
        }
      ]
    },
    {
      "name": "Rodrigo",
      "messages": [
        {
          "mine": false,
          "text": "precisamos de mais cadeiras pro jantar"
        },
        {
          "mine": true,
          "text": "levo 2 da minha varanda"
        },
        {
          "mine": false,
          "text": "boa, chega entao"
        },
        {
          "mine": true,
          "text": "levo quando for ai"
        }
      ]
    },
    {
      "name": "Carolina",
      "messages": [
        {
          "mine": true,
          "text": "a piscina abre a que horas ao domingo?"
        },
        {
          "mine": false,
          "text": "acho que as 9"
        },
        {
          "mine": true,
          "text": "vamos de manha entao?"
        },
        {
          "mine": false,
          "text": "boa, evita a confusao da tarde"
        },
        {
          "mine": true,
          "text": "combinado, levo os oculos"
        }
      ]
    },
    {
      "name": "Afonso",
      "messages": [
        {
          "mine": false,
          "text": "trocaste a roda do carro?"
        },
        {
          "mine": true,
          "text": "troquei, mas o pneu estava mesmo furado"
        },
        {
          "mine": false,
          "text": "tens de comprar um novo"
        },
        {
          "mine": true,
          "text": "vou ao toni amanha"
        }
      ]
    },
    {
      "name": "Madalena",
      "messages": [
        {
          "mine": true,
          "text": "a reuniao de pais e quando?"
        },
        {
          "mine": false,
          "text": "terca as 18h30 na escola"
        },
        {
          "mine": true,
          "text": "vais poder ir?"
        },
        {
          "mine": false,
          "text": "vou, saio mais cedo do trabalho"
        },
        {
          "mine": true,
          "text": "boa, eu tenho reuniao a essa hora"
        }
      ]
    },
    {
      "name": "Guilherme",
      "messages": [
        {
          "mine": false,
          "text": "acabou o cafe la em casa"
        },
        {
          "mine": true,
          "text": "compro na vinda, moido ou em grao?"
        },
        {
          "mine": false,
          "text": "moido, o de sempre"
        },
        {
          "mine": true,
          "text": "ta, trago tb acucar que ta a acabar"
        },
        {
          "mine": false,
          "text": "boa lembranca"
        }
      ]
    },
    {
      "name": "Francisca",
      "messages": [
        {
          "mine": true,
          "text": "vamos aquela feira de artesanato sabado?"
        },
        {
          "mine": false,
          "text": "vamos, ouvi dizer que ta gira este ano"
        },
        {
          "mine": true,
          "text": "encontramo nos la as 15h?"
        },
        {
          "mine": false,
          "text": "boa, junto a entrada"
        },
        {
          "mine": true,
          "text": "ate sabado"
        }
      ]
    },
    {
      "name": "Salvador",
      "messages": [
        {
          "mine": false,
          "text": "podes me trazer a furadeira quando vieres?"
        },
        {
          "mine": true,
          "text": "posso, vou ai domingo"
        },
        {
          "mine": false,
          "text": "obrigado, preciso pendurar um quadro"
        },
        {
          "mine": true,
          "text": "levo tb as buchas"
        }
      ]
    },
    {
      "name": "Benedita",
      "messages": [
        {
          "mine": true,
          "text": "que horas fecha a farmacia hoje?"
        },
        {
          "mine": false,
          "text": "acho que as 20h"
        },
        {
          "mine": true,
          "text": "tenho de ir buscar o xarope do miudo"
        },
        {
          "mine": false,
          "text": "vai ja que a essa hora tem fila"
        },
        {
          "mine": true,
          "text": "boa, vou agora"
        }
      ]
    },
    {
      "name": "Martim",
      "messages": [
        {
          "mine": false,
          "text": "jogamos as cartas hoje a noite?"
        },
        {
          "mine": true,
          "text": "boa, ca em casa?"
        },
        {
          "mine": false,
          "text": "sim, levo os petiscos"
        },
        {
          "mine": true,
          "text": "eu ponho a mesa, vem por volta das 9"
        },
        {
          "mine": false,
          "text": "ate logo"
        }
      ]
    },
    {
      "name": "Constança",
      "messages": [
        {
          "mine": true,
          "text": "viste o meu casaco cinzento?"
        },
        {
          "mine": false,
          "text": "ta no carro, deixaste no banco de tras"
        },
        {
          "mine": true,
          "text": "ainda bem, procurei em todo o lado"
        },
        {
          "mine": false,
          "text": "trago o quando vier"
        }
      ]
    },
    {
      "name": "Lourenço",
      "messages": [
        {
          "mine": false,
          "text": "a que horas comeca o filme sabado?"
        },
        {
          "mine": true,
          "text": "as 21h, mas os bilhetes esgotam rapido"
        },
        {
          "mine": false,
          "text": "compra ja online entao"
        },
        {
          "mine": true,
          "text": "ta, compro 2 e acertamos depois"
        },
        {
          "mine": false,
          "text": "combinado"
        }
      ]
    },
    {
      "name": "Ema",
      "messages": [
        {
          "mine": true,
          "text": "trouxeste as fotos impressas?"
        },
        {
          "mine": false,
          "text": "trouxe, ficaram lindas"
        },
        {
          "mine": true,
          "text": "que bom, dividimos por albuns?"
        },
        {
          "mine": false,
          "text": "sim, faco isso no fim de semana"
        },
        {
          "mine": true,
          "text": "ajudo te se quiseres"
        }
      ]
    },
    {
      "name": "Simão",
      "messages": [
        {
          "mine": false,
          "text": "consegues dar boleia ao treino hoje?"
        },
        {
          "mine": true,
          "text": "consigo, passo por ti as 17h30"
        },
        {
          "mine": false,
          "text": "otimo, espero la fora"
        },
        {
          "mine": true,
          "text": "nao te esquecas das chuteiras rs"
        },
        {
          "mine": false,
          "text": "ja meti na mala"
        }
      ]
    },
    {
      "name": "Íris",
      "messages": [
        {
          "mine": true,
          "text": "que legumes ponho na sopa?"
        },
        {
          "mine": false,
          "text": "cenoura, abobora e um pouco de alho frances"
        },
        {
          "mine": true,
          "text": "e batata?"
        },
        {
          "mine": false,
          "text": "so uma pra engrossar"
        },
        {
          "mine": true,
          "text": "obrigada, fica sempre melhor a tua"
        }
      ]
    },
    {
      "name": "Tomás",
      "messages": [
        {
          "mine": false,
          "text": "mãe posso ir a casa do joao depois da escola?"
        },
        {
          "mine": true,
          "text": "podes, mas jantas ca as 8"
        },
        {
          "mine": false,
          "text": "ta bem, volto a pe"
        },
        {
          "mine": true,
          "text": "manda msg quando saires"
        },
        {
          "mine": false,
          "text": "mando, bjs"
        }
      ]
    },
    {
      "name": "Núria",
      "messages": [
        {
          "mine": true,
          "text": "a loja tem aquela caçarola em promocao?"
        },
        {
          "mine": false,
          "text": "tem, vi ontem, 30% off"
        },
        {
          "mine": true,
          "text": "boa, vou comprar antes que acabe"
        },
        {
          "mine": false,
          "text": "vai hoje que era o ultimo dia acho"
        },
        {
          "mine": true,
          "text": "vou agora entao, obrigada"
        }
      ]
    },
    {
      "name": "Xavier",
      "messages": [
        {
          "mine": false,
          "text": "arranjaste alguem pra pintar a sala?"
        },
        {
          "mine": true,
          "text": "ainda nao, tas a ver alguem?"
        },
        {
          "mine": false,
          "text": "o meu vizinho conhece um bom e barato"
        },
        {
          "mine": true,
          "text": "manda me o contacto"
        },
        {
          "mine": false,
          "text": "mando ja"
        }
      ]
    },
    {
      "name": "Gabriela",
      "messages": [
        {
          "mine": true,
          "text": "a que horas e a aula de ioga amanha?"
        },
        {
          "mine": false,
          "text": "as 19h, a de sempre"
        },
        {
          "mine": true,
          "text": "vamos juntas?"
        },
        {
          "mine": false,
          "text": "boa, passo por ti as 18h40"
        },
        {
          "mine": true,
          "text": "levo o tapete"
        }
      ]
    },
    {
      "name": "Vicente",
      "messages": [
        {
          "mine": false,
          "text": "precisamos de comprar racao pro cao"
        },
        {
          "mine": true,
          "text": "ja acabou?"
        },
        {
          "mine": false,
          "text": "quase, resta pra 2 dias"
        },
        {
          "mine": true,
          "text": "passo no veterinario e trago o saco grande"
        },
        {
          "mine": false,
          "text": "boa, esse rende mais"
        }
      ]
    },
    {
      "name": "Lara",
      "messages": [
        {
          "mine": true,
          "text": "vais a festa de anos da sofia?"
        },
        {
          "mine": false,
          "text": "vou, ja comprei a prenda"
        },
        {
          "mine": true,
          "text": "o que levaste?"
        },
        {
          "mine": false,
          "text": "um livro que ela queria"
        },
        {
          "mine": true,
          "text": "boa ideia, eu ainda nao sei o que levar"
        }
      ]
    },
    {
      "name": "Dinis",
      "messages": [
        {
          "mine": false,
          "text": "a caldeira ta a fazer barulho outra vez"
        },
        {
          "mine": true,
          "text": "chamo o tecnico entao"
        },
        {
          "mine": false,
          "text": "sim, antes que pare de vez no inverno"
        },
        {
          "mine": true,
          "text": "ligo amanha de manha"
        }
      ]
    },
    {
      "name": "Melissa",
      "messages": [
        {
          "mine": true,
          "text": "queres partilhar boleia pro trabalho esta semana?"
        },
        {
          "mine": false,
          "text": "quero, poupa se combustivel"
        },
        {
          "mine": true,
          "text": "eu levo segunda e quarta, tu terca e quinta?"
        },
        {
          "mine": false,
          "text": "combinado, e sexta cada um o seu"
        },
        {
          "mine": true,
          "text": "perfeito"
        }
      ]
    },
    {
      "name": "Rafael",
      "messages": [
        {
          "mine": false,
          "text": "esqueci de comprar velas pro bolo"
        },
        {
          "mine": true,
          "text": "eu passo no supermercado e trago"
        },
        {
          "mine": false,
          "text": "boa, o numero certo e 7"
        },
        {
          "mine": true,
          "text": "levo uma caixa que da e sobra"
        }
      ]
    },
    {
      "name": "Bárbara",
      "messages": [
        {
          "mine": true,
          "text": "a que horas chegas ao aeroporto?"
        },
        {
          "mine": false,
          "text": "por volta das 22h, voo atrasou um pouco"
        },
        {
          "mine": true,
          "text": "vou buscar te, espera na saida"
        },
        {
          "mine": false,
          "text": "obrigada, mando msg quando aterrar"
        },
        {
          "mine": true,
          "text": "conduz com cuidado quem vai sou eu rs"
        }
      ]
    },
    {
      "name": "Henrique",
      "messages": [
        {
          "mine": false,
          "text": "montaste a estante nova?"
        },
        {
          "mine": true,
          "text": "montei, so faltou um parafuso"
        },
        {
          "mine": false,
          "text": "rs sempre falta um"
        },
        {
          "mine": true,
          "text": "ficou boa na mesma"
        }
      ]
    },
    {
      "name": "Daniela",
      "messages": [
        {
          "mine": true,
          "text": "vamos ao mercado de rua no domingo?"
        },
        {
          "mine": false,
          "text": "vamos, dizem que ha queijos otimos"
        },
        {
          "mine": true,
          "text": "boa, quero comprar mel tambem"
        },
        {
          "mine": false,
          "text": "encontramo nos la as 10?"
        },
        {
          "mine": true,
          "text": "combinado, junto a fonte"
        }
      ]
    },
    {
      "name": "Gustavo",
      "messages": [
        {
          "mine": false,
          "text": "trazes o cabo hdmi hoje?"
        },
        {
          "mine": true,
          "text": "trago, ta na gaveta"
        },
        {
          "mine": false,
          "text": "obrigado, quero ligar o portatil a tv"
        },
        {
          "mine": true,
          "text": "levo o comprido que chega melhor"
        }
      ]
    },
    {
      "name": "Camila",
      "messages": [
        {
          "mine": true,
          "text": "a consulta da bebe e amanha ou quinta?"
        },
        {
          "mine": false,
          "text": "amanha as 9h30"
        },
        {
          "mine": true,
          "text": "boa, vou preparar a bolsa hoje"
        },
        {
          "mine": false,
          "text": "leva o boletim de vacinas"
        },
        {
          "mine": true,
          "text": "ja meti, obrigada"
        }
      ]
    },
    {
      "name": "Alberto",
      "messages": [
        {
          "mine": false,
          "text": "o jardim ta a precisar de corte"
        },
        {
          "mine": true,
          "text": "eu trato no sabado de manha"
        },
        {
          "mine": false,
          "text": "a maquina tem gasolina?"
        },
        {
          "mine": true,
          "text": "vou verificar, senao compro"
        },
        {
          "mine": false,
          "text": "boa, obrigado"
        }
      ]
    },
    {
      "name": "Isabel",
      "messages": [
        {
          "mine": true,
          "text": "que horas abre o talho amanha?"
        },
        {
          "mine": false,
          "text": "as 8h30 acho eu"
        },
        {
          "mine": true,
          "text": "quero encomendar carne pro assado"
        },
        {
          "mine": false,
          "text": "liga cedo que sabado enche rapido"
        },
        {
          "mine": true,
          "text": "vou ligar mal abram"
        }
      ]
    },
    {
      "name": "Jorge do café",
      "messages": [
        {
          "mine": false,
          "text": "bom dia, o de sempre?"
        },
        {
          "mine": true,
          "text": "bom dia jorge, sim um galao e uma torrada"
        },
        {
          "mine": false,
          "text": "sai ja, senta que eu levo"
        },
        {
          "mine": true,
          "text": "obrigado, hoje tenho mais 5 min rs"
        },
        {
          "mine": false,
          "text": "entao aproveite o jornal"
        }
      ]
    }
  ],
  "nl": [
    {
      "name": "Mama",
      "messages": [
        {
          "mine": false,
          "text": "hoi lieverd, kom je zondag eten? ik maak boerenkool"
        },
        {
          "mine": true,
          "text": "ja lekker! hoe laat moet ik er zijn"
        },
        {
          "mine": false,
          "text": "rond half 6 is prima, papa haalt nog worst"
        },
        {
          "mine": true,
          "text": "top, zal ik nog een toetje meenemen?"
        },
        {
          "mine": false,
          "text": "hoeft niet hoor, ik heb nog vla in de koelkast"
        },
        {
          "mine": true,
          "text": "oke tot zondag, kus"
        }
      ]
    },
    {
      "name": "Papa",
      "messages": [
        {
          "mine": true,
          "text": "pa, doet de wasmachine het weer?"
        },
        {
          "mine": false,
          "text": "nee joh, hij lekt nog steeds bij de deur"
        },
        {
          "mine": true,
          "text": "misschien het rubber vervangen? kost bijna niks"
        },
        {
          "mine": false,
          "text": "ga ik morgen even naar de bouwmarkt voor"
        },
        {
          "mine": true,
          "text": "zal ik meegaan, heb toch niks te doen"
        },
        {
          "mine": false,
          "text": "graag, kom om 10 uur langs"
        }
      ]
    },
    {
      "name": "Oma",
      "messages": [
        {
          "mine": false,
          "text": "kindje kom je nog een keertje langs deze week?"
        },
        {
          "mine": true,
          "text": "ja oma, donderdag na mijn werk goed?"
        },
        {
          "mine": false,
          "text": "heerlijk, ik bak een appeltaart"
        },
        {
          "mine": true,
          "text": "mmm daar kan ik geen nee tegen zeggen"
        },
        {
          "mine": false,
          "text": "tot donderdag schat"
        }
      ]
    },
    {
      "name": "Opa",
      "messages": [
        {
          "mine": true,
          "text": "opa hoe ging het bij de dokter?"
        },
        {
          "mine": false,
          "text": "prima hoor, bloeddruk is weer goed"
        },
        {
          "mine": true,
          "text": "gelukkig! moet je nog terug?"
        },
        {
          "mine": false,
          "text": "over drie maanden pas, niks aan de hand"
        },
        {
          "mine": true,
          "text": "fijn, tot zaterdag bij het voetbal"
        }
      ]
    },
    {
      "name": "Sanne",
      "messages": [
        {
          "mine": false,
          "text": "zin in koffie morgen? die nieuwe tent bij het station"
        },
        {
          "mine": true,
          "text": "ja leuk! rond 11?"
        },
        {
          "mine": false,
          "text": "perfect, ik reserveer niks hoor is nooit druk"
        },
        {
          "mine": true,
          "text": "prima tot morgen"
        }
      ]
    },
    {
      "name": "Bram",
      "messages": [
        {
          "mine": true,
          "text": "kan ik je boormachine lenen dit weekend?"
        },
        {
          "mine": false,
          "text": "tuurlijk, kom maar langs hij staat in de schuur"
        },
        {
          "mine": true,
          "text": "top, breng em maandag terug"
        },
        {
          "mine": false,
          "text": "geen haast, ik gebruik em toch niet"
        },
        {
          "mine": true,
          "text": "thanks man"
        }
      ]
    },
    {
      "name": "Lisa",
      "messages": [
        {
          "mine": false,
          "text": "heb jij die serie al gezien waar iedereen het over heeft?"
        },
        {
          "mine": true,
          "text": "welke bedoel je, die op netflix?"
        },
        {
          "mine": false,
          "text": "ja die met dat detective ding"
        },
        {
          "mine": true,
          "text": "nog niet, geen tijd gehad deze week"
        },
        {
          "mine": false,
          "text": "moet je echt kijken, beetje traag begin maar dan"
        },
        {
          "mine": true,
          "text": "oke zet em op de lijst"
        }
      ]
    },
    {
      "name": "Tim",
      "messages": [
        {
          "mine": true,
          "text": "voetbal gaat niet door he, veld te nat"
        },
        {
          "mine": false,
          "text": "klopt net een appje gehad van de trainer"
        },
        {
          "mine": true,
          "text": "balen, dan maar zaalvoetbal volgende week"
        },
        {
          "mine": false,
          "text": "prima, ik regel de zaal wel"
        }
      ]
    },
    {
      "name": "Jeroen",
      "messages": [
        {
          "mine": false,
          "text": "rij je morgen mee naar werk? mijn auto staat bij de garage"
        },
        {
          "mine": true,
          "text": "ja hoor, ik pik je om kwart voor 8 op"
        },
        {
          "mine": false,
          "text": "top scheelt me een hoop"
        },
        {
          "mine": true,
          "text": "geen probleem, sta je klaar?"
        },
        {
          "mine": false,
          "text": "ja beneden bij de voordeur"
        }
      ]
    },
    {
      "name": "Femke",
      "messages": [
        {
          "mine": true,
          "text": "gefeliciteerd met je verjaardag!! fijne dag"
        },
        {
          "mine": false,
          "text": "dankjewel lief! kom je vanavond nog even taart eten?"
        },
        {
          "mine": true,
          "text": "ja leuk, hoe laat?"
        },
        {
          "mine": false,
          "text": "vanaf 8 uur, gewoon binnenlopen"
        },
        {
          "mine": true,
          "text": "tot straks!"
        }
      ]
    },
    {
      "name": "Buurvrouw",
      "messages": [
        {
          "mine": false,
          "text": "hoi, er is een pakketje voor jullie bij mij bezorgd"
        },
        {
          "mine": true,
          "text": "oh top, ik kom het zo even halen"
        },
        {
          "mine": false,
          "text": "prima ik ben thuis de hele middag"
        },
        {
          "mine": true,
          "text": "dankjewel weer!"
        }
      ]
    },
    {
      "name": "Jan de loodgieter",
      "messages": [
        {
          "mine": true,
          "text": "goedemorgen, de kraan in de badkamer lekt nog steeds"
        },
        {
          "mine": false,
          "text": "ik kom donderdagochtend langs, schikt dat?"
        },
        {
          "mine": true,
          "text": "ja prima, ik ben vanaf 9 uur thuis"
        },
        {
          "mine": false,
          "text": "top, dan ben ik er rond half 10"
        },
        {
          "mine": true,
          "text": "bedankt alvast"
        }
      ]
    },
    {
      "name": "Kapper Kim",
      "messages": [
        {
          "mine": true,
          "text": "hoi kan ik een afspraak maken voor knippen?"
        },
        {
          "mine": false,
          "text": "natuurlijk! vrijdag 15 uur is nog vrij"
        },
        {
          "mine": true,
          "text": "perfect, doe maar"
        },
        {
          "mine": false,
          "text": "genoteerd, tot vrijdag!"
        }
      ]
    },
    {
      "name": "Tandarts",
      "messages": [
        {
          "mine": false,
          "text": "herinnering: uw controle is dinsdag om 10:20"
        },
        {
          "mine": true,
          "text": "dank voor de herinnering, ik kom eraan"
        },
        {
          "mine": false,
          "text": "fijn, tot dinsdag"
        },
        {
          "mine": true,
          "text": "moet ik nog iets meenemen?"
        },
        {
          "mine": false,
          "text": "nee hoor, gewoon op tijd komen"
        }
      ]
    },
    {
      "name": "Karin",
      "messages": [
        {
          "mine": false,
          "text": "ga jij ook naar de verjaardag van marloes zaterdag?"
        },
        {
          "mine": true,
          "text": "ja denk het wel, jij?"
        },
        {
          "mine": false,
          "text": "ja, zullen we samen rijden?"
        },
        {
          "mine": true,
          "text": "goed idee, ik rij wel"
        },
        {
          "mine": false,
          "text": "top dan tank ik onderweg"
        },
        {
          "mine": true,
          "text": "prima, tot zaterdag"
        }
      ]
    },
    {
      "name": "Werk Rooster",
      "messages": [
        {
          "mine": false,
          "text": "kun je zaterdag de ochtenddienst overnemen van peter?"
        },
        {
          "mine": true,
          "text": "hoe laat begint die?"
        },
        {
          "mine": false,
          "text": "van 8 tot 14 uur"
        },
        {
          "mine": true,
          "text": "oke dat lukt wel, zet me er maar op"
        },
        {
          "mine": false,
          "text": "top bedankt, ik pas het rooster aan"
        }
      ]
    },
    {
      "name": "Els",
      "messages": [
        {
          "mine": true,
          "text": "heb je het recept van die soep nog? was zo lekker"
        },
        {
          "mine": false,
          "text": "ja, pompoen met gember en kokosmelk"
        },
        {
          "mine": true,
          "text": "en verder? hoeveel gember?"
        },
        {
          "mine": false,
          "text": "een klein stukje, en een blokje bouillon erbij"
        },
        {
          "mine": true,
          "text": "top ga ik vanavond maken, dank je"
        }
      ]
    },
    {
      "name": "Marco",
      "messages": [
        {
          "mine": false,
          "text": "wil je zondag mee wandelen in het bos?"
        },
        {
          "mine": true,
          "text": "ja gezellig, hoe laat?"
        },
        {
          "mine": false,
          "text": "10 uur bij de parkeerplaats?"
        },
        {
          "mine": true,
          "text": "prima, ik neem koffie mee in een thermoskan"
        },
        {
          "mine": false,
          "text": "top tot zondag"
        }
      ]
    },
    {
      "name": "Nadia",
      "messages": [
        {
          "mine": true,
          "text": "hoe was je vakantie? mooi weer gehad?"
        },
        {
          "mine": false,
          "text": "heerlijk! elke dag zon, veel gezwommen"
        },
        {
          "mine": true,
          "text": "wat fijn, foto's laten zien binnenkort?"
        },
        {
          "mine": false,
          "text": "ja tuurlijk, komende week koffie?"
        },
        {
          "mine": true,
          "text": "leuk, ik app je nog"
        }
      ]
    },
    {
      "name": "Rick",
      "messages": [
        {
          "mine": false,
          "text": "de barbecue is dit weekend nog steeds aan he?"
        },
        {
          "mine": true,
          "text": "ja zeker, weer wordt top"
        },
        {
          "mine": false,
          "text": "wat moet ik meenemen?"
        },
        {
          "mine": true,
          "text": "een salade misschien? vlees regel ik"
        },
        {
          "mine": false,
          "text": "komt goed, tot zaterdag"
        }
      ]
    },
    {
      "name": "Ingrid",
      "messages": [
        {
          "mine": true,
          "text": "kun jij morgen de kinderen ophalen van school?"
        },
        {
          "mine": false,
          "text": "ja hoor, hoe laat zijn ze uit?"
        },
        {
          "mine": true,
          "text": "kwart over 3, groep 5 bij de zijingang"
        },
        {
          "mine": false,
          "text": "komt goed, breng ik ze bij jou langs"
        },
        {
          "mine": true,
          "text": "je bent een schat, bedankt"
        }
      ]
    },
    {
      "name": "Dennis",
      "messages": [
        {
          "mine": false,
          "text": "heb je die klus nog kunnen doen aan de schutting?"
        },
        {
          "mine": true,
          "text": "half, het regende steeds"
        },
        {
          "mine": false,
          "text": "morgen wordt droog geloof ik"
        },
        {
          "mine": true,
          "text": "dan maak ik het af, kom je helpen?"
        },
        {
          "mine": false,
          "text": "ja joh, ik neem de schroeven mee"
        }
      ]
    },
    {
      "name": "Wendy",
      "messages": [
        {
          "mine": true,
          "text": "gaan we nog naar de markt zaterdag?"
        },
        {
          "mine": false,
          "text": "ja graag, ik wil verse vis halen"
        },
        {
          "mine": true,
          "text": "en ik bloemen, half 10 daar?"
        },
        {
          "mine": false,
          "text": "prima, bij de kaaskraam afspreken"
        },
        {
          "mine": true,
          "text": "top tot dan"
        }
      ]
    },
    {
      "name": "Hugo",
      "messages": [
        {
          "mine": false,
          "text": "kun je de hond even uitlaten vanmiddag? ik moet overwerken"
        },
        {
          "mine": true,
          "text": "ja hoor geen probleem, rond 5?"
        },
        {
          "mine": false,
          "text": "perfect, de riem hangt bij de deur"
        },
        {
          "mine": true,
          "text": "komt goed, fijne dag nog"
        }
      ]
    },
    {
      "name": "Petra",
      "messages": [
        {
          "mine": true,
          "text": "heb je nog zin om samen te sporten morgen?"
        },
        {
          "mine": false,
          "text": "ja! yoga of hardlopen?"
        },
        {
          "mine": true,
          "text": "hardlopen lijkt me wel, rondje park"
        },
        {
          "mine": false,
          "text": "oke half 8 bij de ingang"
        },
        {
          "mine": true,
          "text": "tot dan, niet verslapen"
        }
      ]
    },
    {
      "name": "Ouder groep 6",
      "messages": [
        {
          "mine": false,
          "text": "wie kan er maandag rijden naar het schoolreisje?"
        },
        {
          "mine": true,
          "text": "ik kan wel, heb 4 plekken"
        },
        {
          "mine": false,
          "text": "top! we verzamelen om 8:30 op het plein"
        },
        {
          "mine": true,
          "text": "genoteerd, ik zorg dat ik op tijd ben"
        },
        {
          "mine": false,
          "text": "dankjewel, fijne avond"
        }
      ]
    },
    {
      "name": "Bakker",
      "messages": [
        {
          "mine": true,
          "text": "kan ik voor zaterdag 2 bruine broden bestellen?"
        },
        {
          "mine": false,
          "text": "natuurlijk, heel of gesneden?"
        },
        {
          "mine": true,
          "text": "gesneden graag"
        },
        {
          "mine": false,
          "text": "komt goed, klaar vanaf 9 uur"
        },
        {
          "mine": true,
          "text": "dank u wel"
        }
      ]
    },
    {
      "name": "Monique",
      "messages": [
        {
          "mine": false,
          "text": "zin in een filmavondje vrijdag?"
        },
        {
          "mine": true,
          "text": "ja leuk! wie neemt de snacks"
        },
        {
          "mine": false,
          "text": "ik regel chips en popcorn"
        },
        {
          "mine": true,
          "text": "dan neem ik drinken mee"
        },
        {
          "mine": false,
          "text": "top, 8 uur bij mij"
        }
      ]
    },
    {
      "name": "Robert",
      "messages": [
        {
          "mine": true,
          "text": "gaat de vergadering morgen door?"
        },
        {
          "mine": false,
          "text": "ja, verschoven naar 14 uur"
        },
        {
          "mine": true,
          "text": "oke dan pas ik mijn agenda aan"
        },
        {
          "mine": false,
          "text": "zaal 2 dit keer"
        },
        {
          "mine": true,
          "text": "duidelijk, tot morgen"
        }
      ]
    },
    {
      "name": "Anouk",
      "messages": [
        {
          "mine": false,
          "text": "heb je toevallig een eierklopper? de mijne is stuk"
        },
        {
          "mine": true,
          "text": "ja hoor, kom maar halen"
        },
        {
          "mine": false,
          "text": "top, mag ik em het weekend houden?"
        },
        {
          "mine": true,
          "text": "prima, ik gebruik em toch niet"
        },
        {
          "mine": false,
          "text": "je bent geweldig, dank"
        }
      ]
    },
    {
      "name": "Chantal",
      "messages": [
        {
          "mine": true,
          "text": "hoe laat spreken we morgen af bij de dierenarts?"
        },
        {
          "mine": false,
          "text": "de afspraak is om 11:15"
        },
        {
          "mine": true,
          "text": "zal ik je oppikken? scheelt jou parkeren"
        },
        {
          "mine": false,
          "text": "graag! rond half 11 dan"
        },
        {
          "mine": true,
          "text": "prima, tot morgen"
        }
      ]
    },
    {
      "name": "Vincent",
      "messages": [
        {
          "mine": false,
          "text": "de auto maakt een raar geluid, ken jij een goeie garage?"
        },
        {
          "mine": true,
          "text": "ja die op de industrieweg, betrouwbaar"
        },
        {
          "mine": true,
          "text": "vraag naar henk, hij helpt je snel"
        },
        {
          "mine": false,
          "text": "top ik bel ze morgen, thanks"
        }
      ]
    },
    {
      "name": "Saskia",
      "messages": [
        {
          "mine": true,
          "text": "kom je koffie drinken vanmiddag? heb koekjes gebakken"
        },
        {
          "mine": false,
          "text": "ja gezellig! hoe laat"
        },
        {
          "mine": true,
          "text": "vanaf 2 uur ben ik thuis"
        },
        {
          "mine": false,
          "text": "ik kom rond half 3, tot zo"
        }
      ]
    },
    {
      "name": "Gerard",
      "messages": [
        {
          "mine": false,
          "text": "de vuilnis wordt morgen opgehaald, welke bak?"
        },
        {
          "mine": true,
          "text": "de grijze denk ik, plastic was vorige week"
        },
        {
          "mine": false,
          "text": "oke ik zet em vanavond aan de straat"
        },
        {
          "mine": true,
          "text": "top, dan zet ik de onze er ook bij"
        }
      ]
    },
    {
      "name": "Yvonne",
      "messages": [
        {
          "mine": true,
          "text": "heb je de foto's van het feestje al?"
        },
        {
          "mine": false,
          "text": "ja! ik stuur ze zo in een mapje"
        },
        {
          "mine": true,
          "text": "leuk, waren echt gezellige avond"
        },
        {
          "mine": false,
          "text": "zeker weten, snel weer afspreken"
        },
        {
          "mine": true,
          "text": "ja graag, ik app je"
        }
      ]
    },
    {
      "name": "Bas",
      "messages": [
        {
          "mine": false,
          "text": "ga je mee vissen zondagochtend? weer is rustig"
        },
        {
          "mine": true,
          "text": "vroeg he? hoe laat"
        },
        {
          "mine": false,
          "text": "half 7 aan de plas"
        },
        {
          "mine": true,
          "text": "oke ik neem broodjes mee"
        },
        {
          "mine": false,
          "text": "top, ik zorg voor koffie"
        }
      ]
    },
    {
      "name": "Miranda",
      "messages": [
        {
          "mine": true,
          "text": "kun je zaterdag oppassen? we willen even uit eten"
        },
        {
          "mine": false,
          "text": "ja leuk! hoe laat en tot hoe laat"
        },
        {
          "mine": true,
          "text": "vanaf 6, we zijn rond 11 terug"
        },
        {
          "mine": false,
          "text": "prima, de kids en ik maken er een spelletjesavond van"
        },
        {
          "mine": true,
          "text": "je bent een topper, dank je"
        }
      ]
    },
    {
      "name": "Kees",
      "messages": [
        {
          "mine": false,
          "text": "kun je me helpen verhuizen zaterdag? paar dozen maar"
        },
        {
          "mine": true,
          "text": "ja hoor, hoe laat begin je"
        },
        {
          "mine": false,
          "text": "9 uur, koffie en broodjes van mij"
        },
        {
          "mine": true,
          "text": "afgesproken, ik neem mijn handschoenen mee"
        },
        {
          "mine": false,
          "text": "top, dank je wel"
        }
      ]
    },
    {
      "name": "Linda",
      "messages": [
        {
          "mine": true,
          "text": "heb je nog tips voor een verjaardagscadeau voor mijn zus?"
        },
        {
          "mine": false,
          "text": "wat vindt ze leuk?"
        },
        {
          "mine": true,
          "text": "ze houdt van planten en thee"
        },
        {
          "mine": false,
          "text": "een mooie theemok met een klein plantje misschien"
        },
        {
          "mine": true,
          "text": "goed idee, ga ik doen, dank"
        }
      ]
    },
    {
      "name": "Ahmed",
      "messages": [
        {
          "mine": false,
          "text": "we spelen morgen zaalvoetbal, jij erbij?"
        },
        {
          "mine": true,
          "text": "ja zeker, hoe laat en waar"
        },
        {
          "mine": false,
          "text": "8 uur, sporthal noord"
        },
        {
          "mine": true,
          "text": "top, ik neem water mee"
        },
        {
          "mine": false,
          "text": "goed, tot morgen"
        }
      ]
    },
    {
      "name": "Corina",
      "messages": [
        {
          "mine": true,
          "text": "wat een weer he, regent al de hele dag"
        },
        {
          "mine": false,
          "text": "echt bizar, mijn was hangt binnen nu"
        },
        {
          "mine": true,
          "text": "zelfde hier, morgen wordt beter geloof ik"
        },
        {
          "mine": false,
          "text": "hoop het, ben die grijze lucht zat"
        }
      ]
    },
    {
      "name": "Ouderavond",
      "messages": [
        {
          "mine": false,
          "text": "de ouderavond is verplaatst naar donderdag 19:30"
        },
        {
          "mine": true,
          "text": "oke bedankt voor de info, ik ben erbij"
        },
        {
          "mine": false,
          "text": "fijn, in het klaslokaal van juf anne"
        },
        {
          "mine": true,
          "text": "duidelijk, tot donderdag"
        }
      ]
    },
    {
      "name": "Sander",
      "messages": [
        {
          "mine": true,
          "text": "heb je die schroevendraaierset nog van me?"
        },
        {
          "mine": false,
          "text": "oh ja klopt, sorry! breng ik morgen langs"
        },
        {
          "mine": true,
          "text": "geen haast hoor, komt goed"
        },
        {
          "mine": false,
          "text": "toch even doen, ik loop toch langs"
        },
        {
          "mine": true,
          "text": "top, tot morgen dan"
        }
      ]
    },
    {
      "name": "Denise",
      "messages": [
        {
          "mine": false,
          "text": "zullen we samen naar de sportschool? motivatie is ver te zoeken"
        },
        {
          "mine": true,
          "text": "haha herkenbaar, morgenavond?"
        },
        {
          "mine": false,
          "text": "ja 7 uur, dan gaan we"
        },
        {
          "mine": true,
          "text": "afgesproken, geen smoesjes"
        }
      ]
    },
    {
      "name": "Ronald",
      "messages": [
        {
          "mine": true,
          "text": "de cv ketel doet raar, geen warm water meer"
        },
        {
          "mine": false,
          "text": "heb je de druk gecheckt? moet rond 1.5 zijn"
        },
        {
          "mine": true,
          "text": "staat op 0.8, dat is te laag he"
        },
        {
          "mine": false,
          "text": "ja bijvullen dan, ken je het kraantje?"
        },
        {
          "mine": true,
          "text": "ja ik zoek em op, thanks voor de tip"
        }
      ]
    },
    {
      "name": "Fleur",
      "messages": [
        {
          "mine": false,
          "text": "heb je zin om samen te lunchen morgen?"
        },
        {
          "mine": true,
          "text": "ja leuk, dat broodjeszaakje op de hoek?"
        },
        {
          "mine": false,
          "text": "perfect, half 1?"
        },
        {
          "mine": true,
          "text": "prima, tot morgen"
        }
      ]
    },
    {
      "name": "Joost",
      "messages": [
        {
          "mine": true,
          "text": "gaan we volgende week nog klussen aan de schuur?"
        },
        {
          "mine": false,
          "text": "ja graag, verf is bijna op alleen"
        },
        {
          "mine": true,
          "text": "ik haal wel nieuwe bij de bouwmarkt"
        },
        {
          "mine": false,
          "text": "top, zelfde kleur groen he"
        },
        {
          "mine": true,
          "text": "ja komt goed"
        }
      ]
    },
    {
      "name": "Marloes",
      "messages": [
        {
          "mine": false,
          "text": "dankjewel voor het leuke cadeau! echt lief"
        },
        {
          "mine": true,
          "text": "graag gedaan! blij dat je het mooi vindt"
        },
        {
          "mine": false,
          "text": "heel erg, past precies bij de kast"
        },
        {
          "mine": true,
          "text": "haha perfect dan, fijne dag nog"
        }
      ]
    },
    {
      "name": "Werk Nynke",
      "messages": [
        {
          "mine": true,
          "text": "heb jij het verslag van gisteren al af?"
        },
        {
          "mine": false,
          "text": "bijna, stuur het voor 4 uur op"
        },
        {
          "mine": true,
          "text": "top, ik moet het nog even nakijken"
        },
        {
          "mine": false,
          "text": "komt goed, ik zet jou in de cc"
        },
        {
          "mine": true,
          "text": "duidelijk, dank je"
        }
      ]
    },
    {
      "name": "Tante Ans",
      "messages": [
        {
          "mine": false,
          "text": "kom je met de feestdagen nog langs?"
        },
        {
          "mine": true,
          "text": "ja graag tante, tweede kerstdag?"
        },
        {
          "mine": false,
          "text": "heerlijk, ik maak dan die stamppot"
        },
        {
          "mine": true,
          "text": "mmm daar verheug ik me op"
        },
        {
          "mine": false,
          "text": "tot dan lieverd"
        }
      ]
    },
    {
      "name": "Oom Piet",
      "messages": [
        {
          "mine": true,
          "text": "oom, doet je aanhanger het nog? wil wat tuinafval wegbrengen"
        },
        {
          "mine": false,
          "text": "ja hoor, kom em maar lenen dit weekend"
        },
        {
          "mine": true,
          "text": "top, zaterdagochtend goed?"
        },
        {
          "mine": false,
          "text": "prima, staat achter het huis"
        },
        {
          "mine": true,
          "text": "dank je, breng em netjes terug"
        }
      ]
    },
    {
      "name": "Iris",
      "messages": [
        {
          "mine": false,
          "text": "heb je nog een goed boek gelezen laatst?"
        },
        {
          "mine": true,
          "text": "ja! dat over die vrouw die gaat reizen, echt fijn"
        },
        {
          "mine": false,
          "text": "klinkt goed, hoe heet het?"
        },
        {
          "mine": true,
          "text": "weet ik zo niet meer, ik stuur je de titel"
        },
        {
          "mine": false,
          "text": "top dank je"
        }
      ]
    },
    {
      "name": "Maarten",
      "messages": [
        {
          "mine": true,
          "text": "gaan we zaterdag naar de wedstrijd?"
        },
        {
          "mine": false,
          "text": "ja, kaartjes heb ik al"
        },
        {
          "mine": true,
          "text": "top, hoe laat verzamelen"
        },
        {
          "mine": false,
          "text": "1 uur bij het café, dan lopen we samen"
        },
        {
          "mine": true,
          "text": "afgesproken"
        }
      ]
    },
    {
      "name": "Esther",
      "messages": [
        {
          "mine": false,
          "text": "kun je mijn planten water geven volgende week? ben weg"
        },
        {
          "mine": true,
          "text": "ja hoor, geef me de sleutel maar"
        },
        {
          "mine": false,
          "text": "breng em vanavond langs, dank je"
        },
        {
          "mine": true,
          "text": "geen probleem, fijne reis alvast"
        }
      ]
    },
    {
      "name": "Willem",
      "messages": [
        {
          "mine": true,
          "text": "de buurman klaagt weer over de heg, snoeien we em samen?"
        },
        {
          "mine": false,
          "text": "ja is ook wel erg hoog geworden"
        },
        {
          "mine": true,
          "text": "zondag? ik heb de heggenschaar"
        },
        {
          "mine": false,
          "text": "prima, ik zorg voor de zakken"
        },
        {
          "mine": true,
          "text": "top tot zondag"
        }
      ]
    },
    {
      "name": "Priya",
      "messages": [
        {
          "mine": false,
          "text": "heb je het recept van die curry? was heerlijk laatst"
        },
        {
          "mine": true,
          "text": "ja! ik stuur em zo door, veel komijn erin"
        },
        {
          "mine": false,
          "text": "top dank je, ga ik dit weekend proberen"
        },
        {
          "mine": true,
          "text": "succes, laat weten hoe hij smaakt"
        }
      ]
    },
    {
      "name": "Ruben",
      "messages": [
        {
          "mine": true,
          "text": "kun je me een lift geven naar het station morgen?"
        },
        {
          "mine": false,
          "text": "ja hoor, hoe laat gaat je trein"
        },
        {
          "mine": true,
          "text": "8:40, dus rond 8:20 vertrekken?"
        },
        {
          "mine": false,
          "text": "prima, ik sta klaar"
        },
        {
          "mine": true,
          "text": "top bedankt"
        }
      ]
    },
    {
      "name": "Sofie",
      "messages": [
        {
          "mine": false,
          "text": "de kids willen graag naar de speeltuin zaterdag, ga je mee?"
        },
        {
          "mine": true,
          "text": "ja leuk, die grote bij het park?"
        },
        {
          "mine": false,
          "text": "ja die, rond 10 uur"
        },
        {
          "mine": true,
          "text": "top, ik neem sap en koekjes mee"
        },
        {
          "mine": false,
          "text": "fijn, tot zaterdag"
        }
      ]
    },
    {
      "name": "Peter",
      "messages": [
        {
          "mine": true,
          "text": "kun je zaterdag mijn dienst overnemen? ik heb een bruiloft"
        },
        {
          "mine": false,
          "text": "ja dat lukt wel, welke uren"
        },
        {
          "mine": true,
          "text": "8 tot 2, ochtenddienst"
        },
        {
          "mine": false,
          "text": "prima genoteerd, veel plezier op de bruiloft"
        },
        {
          "mine": true,
          "text": "dank je, ik neem het een keer terug"
        }
      ]
    },
    {
      "name": "Cynthia",
      "messages": [
        {
          "mine": false,
          "text": "ga jij ook naar de open dag van de school?"
        },
        {
          "mine": true,
          "text": "ja denk het, jij ook?"
        },
        {
          "mine": false,
          "text": "ja, zullen we samen gaan?"
        },
        {
          "mine": true,
          "text": "leuk, half 11 daar?"
        },
        {
          "mine": false,
          "text": "prima, tot dan"
        }
      ]
    },
    {
      "name": "Frank",
      "messages": [
        {
          "mine": true,
          "text": "heb je nog een kruk over voor het feest? kom er 2 tekort"
        },
        {
          "mine": false,
          "text": "ja twee staan in de garage, kom maar halen"
        },
        {
          "mine": true,
          "text": "top, ik pik ze morgen op"
        },
        {
          "mine": false,
          "text": "prima, breng ze een keer terug"
        },
        {
          "mine": true,
          "text": "komt goed, dank"
        }
      ]
    },
    {
      "name": "Angela",
      "messages": [
        {
          "mine": false,
          "text": "wat een drukte in de supermarkt vandaag zeg"
        },
        {
          "mine": true,
          "text": "ja altijd op vrijdag he"
        },
        {
          "mine": false,
          "text": "volgende keer ga ik doordeweeks"
        },
        {
          "mine": true,
          "text": "goed plan, veel rustiger"
        }
      ]
    },
    {
      "name": "Job",
      "messages": [
        {
          "mine": true,
          "text": "gaan we nog samen naar de bouwmarkt vanmiddag?"
        },
        {
          "mine": false,
          "text": "ja, ik heb verf en kwasten nodig"
        },
        {
          "mine": true,
          "text": "ik moet schroeven en een plank"
        },
        {
          "mine": false,
          "text": "half 2 vertrekken?"
        },
        {
          "mine": true,
          "text": "prima, ik rij"
        }
      ]
    },
    {
      "name": "Manon",
      "messages": [
        {
          "mine": false,
          "text": "hoe was de eerste schooldag van de kleine?"
        },
        {
          "mine": true,
          "text": "spannend maar leuk! ze vond het gezellig"
        },
        {
          "mine": false,
          "text": "wat fijn, heeft ze al vriendjes?"
        },
        {
          "mine": true,
          "text": "ja eentje al, heet noud"
        },
        {
          "mine": false,
          "text": "schattig, groetjes aan haar"
        }
      ]
    },
    {
      "name": "Thijs",
      "messages": [
        {
          "mine": true,
          "text": "gaat de wandelclub zondag door?"
        },
        {
          "mine": false,
          "text": "ja hoor, verzamelen bij de kerk om 10"
        },
        {
          "mine": true,
          "text": "top, welke route?"
        },
        {
          "mine": false,
          "text": "de lange langs het water"
        },
        {
          "mine": true,
          "text": "mooi, tot zondag"
        }
      ]
    },
    {
      "name": "Rekening houden",
      "messages": [
        {
          "mine": false,
          "text": "vergeet niet: morgen komt de glasbak niet, feestdag"
        },
        {
          "mine": true,
          "text": "oh goed dat je het zegt, dan wacht ik"
        },
        {
          "mine": false,
          "text": "ja pas volgende week weer"
        },
        {
          "mine": true,
          "text": "duidelijk, dank voor de reminder"
        }
      ]
    },
    {
      "name": "Hanneke",
      "messages": [
        {
          "mine": true,
          "text": "kun je me het adres van die goeie fietsenmaker sturen?"
        },
        {
          "mine": false,
          "text": "ja die op de dorpsstraat, naast de bakker"
        },
        {
          "mine": true,
          "text": "top, mijn ketting loopt vast"
        },
        {
          "mine": false,
          "text": "hij helpt je snel, vraag naar theo"
        },
        {
          "mine": true,
          "text": "dank je, ga ik langs"
        }
      ]
    },
    {
      "name": "Ouder Milan",
      "messages": [
        {
          "mine": false,
          "text": "komt milan zaterdag spelen bij jullie?"
        },
        {
          "mine": true,
          "text": "ja leuk! vanaf een uur of 2?"
        },
        {
          "mine": false,
          "text": "prima, ik breng em en haal em rond 5"
        },
        {
          "mine": true,
          "text": "top, ze gaan vast lekker buiten spelen"
        },
        {
          "mine": false,
          "text": "fijn, tot zaterdag"
        }
      ]
    },
    {
      "name": "Roos",
      "messages": [
        {
          "mine": true,
          "text": "ga je mee naar die kringloopwinkel zaterdag?"
        },
        {
          "mine": false,
          "text": "ja leuk! zoek nog een kastje"
        },
        {
          "mine": false,
          "text": "hoe laat?"
        },
        {
          "mine": true,
          "text": "half 11? dan is het rustig"
        },
        {
          "mine": false,
          "text": "prima, ik pik je op"
        }
      ]
    },
    {
      "name": "Erik",
      "messages": [
        {
          "mine": false,
          "text": "de vergadering van maandag is geannuleerd"
        },
        {
          "mine": true,
          "text": "oh top, dan heb ik meer tijd voor het rapport"
        },
        {
          "mine": false,
          "text": "ja precies, nieuwe datum volgt nog"
        },
        {
          "mine": true,
          "text": "duidelijk, bedankt voor het doorgeven"
        }
      ]
    },
    {
      "name": "Britt",
      "messages": [
        {
          "mine": true,
          "text": "heb je zin om samen te bakken zaterdag? appeltaart"
        },
        {
          "mine": false,
          "text": "ja hoe leuk! ik neem de appels mee"
        },
        {
          "mine": true,
          "text": "top, ik heb bloem en boter in huis"
        },
        {
          "mine": false,
          "text": "en slagroom voor erbij"
        },
        {
          "mine": true,
          "text": "mmm perfect, tot zaterdag"
        }
      ]
    },
    {
      "name": "Ali",
      "messages": [
        {
          "mine": false,
          "text": "gaan we nog samen naar die nieuwe shoarmazaak?"
        },
        {
          "mine": true,
          "text": "ja hoorde dat ie goed was, vanavond?"
        },
        {
          "mine": false,
          "text": "prima, half 7?"
        },
        {
          "mine": true,
          "text": "afgesproken, tot straks"
        }
      ]
    },
    {
      "name": "Nienke",
      "messages": [
        {
          "mine": true,
          "text": "kun jij morgen mijn pakketje aannemen? ik ben niet thuis"
        },
        {
          "mine": false,
          "text": "ja hoor, geen probleem"
        },
        {
          "mine": true,
          "text": "top, komt tussen 10 en 12"
        },
        {
          "mine": false,
          "text": "ik ben thuis, ik hou het voor je"
        },
        {
          "mine": true,
          "text": "dank je, ik haal het s avonds op"
        }
      ]
    },
    {
      "name": "Ouder Sophie",
      "messages": [
        {
          "mine": false,
          "text": "sophie is jarig zaterdag, komen jullie op het feestje?"
        },
        {
          "mine": true,
          "text": "ja leuk! hoe laat"
        },
        {
          "mine": false,
          "text": "vanaf 2 uur, tot een uur of 5"
        },
        {
          "mine": true,
          "text": "top, we zijn er, cadeautje wordt geregeld"
        },
        {
          "mine": false,
          "text": "gezellig, tot zaterdag"
        }
      ]
    },
    {
      "name": "Gijs",
      "messages": [
        {
          "mine": true,
          "text": "gaan we volgende week nog een biertje drinken?"
        },
        {
          "mine": false,
          "text": "ja graag, donderdag?"
        },
        {
          "mine": true,
          "text": "prima, dat cafe op het plein"
        },
        {
          "mine": false,
          "text": "8 uur daar?"
        },
        {
          "mine": true,
          "text": "afgesproken"
        }
      ]
    },
    {
      "name": "Marij",
      "messages": [
        {
          "mine": false,
          "text": "heb je nog een goeie oppas voor de kids? die van ons kan niet"
        },
        {
          "mine": true,
          "text": "ja mijn buurmeisje past graag op, betrouwbaar"
        },
        {
          "mine": false,
          "text": "top, mag ik haar nummer?"
        },
        {
          "mine": true,
          "text": "ik vraag het even en stuur het door"
        },
        {
          "mine": false,
          "text": "je bent een schat, dank"
        }
      ]
    },
    {
      "name": "Stefan",
      "messages": [
        {
          "mine": true,
          "text": "de trein heeft vertraging, ben iets later op werk"
        },
        {
          "mine": false,
          "text": "geen zorgen, ik zeg het tegen de rest"
        },
        {
          "mine": true,
          "text": "dank je, hopelijk niet te lang"
        },
        {
          "mine": false,
          "text": "komt goed, rustig aan"
        }
      ]
    },
    {
      "name": "Carla",
      "messages": [
        {
          "mine": false,
          "text": "zullen we zondag naar de dierentuin met de kinderen?"
        },
        {
          "mine": true,
          "text": "ja leuk idee! weer wordt goed"
        },
        {
          "mine": false,
          "text": "half 10 daar? voor de drukte uit"
        },
        {
          "mine": true,
          "text": "prima, ik neem lunch mee"
        },
        {
          "mine": false,
          "text": "top, tot zondag"
        }
      ]
    },
    {
      "name": "Bram schoonzoon",
      "messages": [
        {
          "mine": true,
          "text": "kun je zondag helpen met de tuin? boompje planten"
        },
        {
          "mine": false,
          "text": "ja hoor, ik neem mijn schep mee"
        },
        {
          "mine": true,
          "text": "top, rond 11 uur?"
        },
        {
          "mine": false,
          "text": "prima, koffie erbij graag"
        },
        {
          "mine": true,
          "text": "komt goed"
        }
      ]
    },
    {
      "name": "Judith",
      "messages": [
        {
          "mine": false,
          "text": "wat maak jij vanavond te eten? ik heb geen inspiratie"
        },
        {
          "mine": true,
          "text": "pasta pesto, snel en makkelijk"
        },
        {
          "mine": false,
          "text": "goed idee, heb ik alles voor"
        },
        {
          "mine": true,
          "text": "voeg wat zongedroogde tomaatjes toe, lekker"
        },
        {
          "mine": false,
          "text": "top ga ik doen, dank"
        }
      ]
    },
    {
      "name": "Ouder Noa",
      "messages": [
        {
          "mine": false,
          "text": "kunnen de meiden samen naar zwemles fietsen?"
        },
        {
          "mine": true,
          "text": "ja goed idee, vanaf welke week?"
        },
        {
          "mine": false,
          "text": "vanaf maandag, half 4 begint het"
        },
        {
          "mine": true,
          "text": "prima, ze verzamelen bij ons dan"
        },
        {
          "mine": false,
          "text": "top, scheelt heen en weer rijden"
        }
      ]
    },
    {
      "name": "Dirk",
      "messages": [
        {
          "mine": true,
          "text": "gaat het klussen morgen door? weer ziet er slecht uit"
        },
        {
          "mine": false,
          "text": "binnenklus, dus geen probleem"
        },
        {
          "mine": true,
          "text": "oh ja de badkamer, klopt"
        },
        {
          "mine": false,
          "text": "9 uur begin ik, kom je helpen?"
        },
        {
          "mine": true,
          "text": "ja ik ben er"
        }
      ]
    },
    {
      "name": "Lotte",
      "messages": [
        {
          "mine": false,
          "text": "heb je zin in een terrasje vanmiddag? zonnetje schijnt"
        },
        {
          "mine": true,
          "text": "ja lekker! die tent aan de gracht?"
        },
        {
          "mine": false,
          "text": "perfect, 3 uur daar?"
        },
        {
          "mine": true,
          "text": "prima, ik zoek een plekje in de zon"
        }
      ]
    },
    {
      "name": "Werk Hassan",
      "messages": [
        {
          "mine": true,
          "text": "kun jij de presentatie van dinsdag overnemen? ik ben ziek"
        },
        {
          "mine": false,
          "text": "ja beterschap zeg! stuur me je slides even"
        },
        {
          "mine": true,
          "text": "doe ik zo, dank je"
        },
        {
          "mine": false,
          "text": "komt goed, rust lekker uit"
        }
      ]
    },
    {
      "name": "Ellen",
      "messages": [
        {
          "mine": false,
          "text": "gaan we nog naar dat tuincentrum voor nieuwe planten?"
        },
        {
          "mine": true,
          "text": "ja graag, mijn balkon is kaal"
        },
        {
          "mine": false,
          "text": "zaterdagochtend?"
        },
        {
          "mine": true,
          "text": "prima, ik rij wel"
        },
        {
          "mine": false,
          "text": "top, we halen ook wat kruiden"
        }
      ]
    },
    {
      "name": "Teun",
      "messages": [
        {
          "mine": true,
          "text": "doet je grasmaaier het nog? de mijne is kapot"
        },
        {
          "mine": false,
          "text": "ja hoor, kom em maar lenen"
        },
        {
          "mine": true,
          "text": "top, vanmiddag ophalen?"
        },
        {
          "mine": false,
          "text": "prima, staat in de schuur klaar"
        },
        {
          "mine": true,
          "text": "dank je buurman"
        }
      ]
    },
    {
      "name": "Wies",
      "messages": [
        {
          "mine": false,
          "text": "kom je zaterdag koffie drinken? lang niet gezien"
        },
        {
          "mine": true,
          "text": "ja gezellig! hoe laat"
        },
        {
          "mine": false,
          "text": "vanaf 11 uur ben ik thuis"
        },
        {
          "mine": true,
          "text": "ik neem wat lekkers mee"
        },
        {
          "mine": false,
          "text": "hoeft niet hoor, maar leuk"
        }
      ]
    },
    {
      "name": "Ouder Daan",
      "messages": [
        {
          "mine": true,
          "text": "kan daan meerijden naar de voetbaltraining morgen?"
        },
        {
          "mine": false,
          "text": "ja hoor, we halen em om kwart voor 6 op"
        },
        {
          "mine": true,
          "text": "top, hij staat klaar met zijn tas"
        },
        {
          "mine": false,
          "text": "prima, breng em ook weer thuis"
        },
        {
          "mine": true,
          "text": "je bent geweldig, dank"
        }
      ]
    },
    {
      "name": "Rob",
      "messages": [
        {
          "mine": false,
          "text": "heb je die klapstoelen nog van de vorige bbq?"
        },
        {
          "mine": true,
          "text": "ja twee stuks, wil je ze terug?"
        },
        {
          "mine": false,
          "text": "graag, gebruik ze zondag"
        },
        {
          "mine": true,
          "text": "kom ze maar halen, staan bij de voordeur"
        },
        {
          "mine": false,
          "text": "top, tot zo"
        }
      ]
    },
    {
      "name": "Sara",
      "messages": [
        {
          "mine": true,
          "text": "zullen we samen naar de bioscoop volgende week?"
        },
        {
          "mine": false,
          "text": "ja leuk! welke film"
        },
        {
          "mine": true,
          "text": "die nieuwe komedie, schijnt grappig te zijn"
        },
        {
          "mine": false,
          "text": "top, woensdagavond?"
        },
        {
          "mine": true,
          "text": "prima, ik boek de kaartjes"
        }
      ]
    },
    {
      "name": "Meneer Bakker school",
      "messages": [
        {
          "mine": false,
          "text": "de gymles is morgen buiten, denk aan sportschoenen"
        },
        {
          "mine": true,
          "text": "dank voor de info, ik geef het door aan haar"
        },
        {
          "mine": false,
          "text": "fijn, en een jas mee ivm de wind"
        },
        {
          "mine": true,
          "text": "komt goed, tot morgen"
        }
      ]
    },
    {
      "name": "Guus",
      "messages": [
        {
          "mine": true,
          "text": "gaan we dit weekend nog vissen of niet?"
        },
        {
          "mine": false,
          "text": "weer is goed, zondagochtend?"
        },
        {
          "mine": true,
          "text": "prima, zelfde plek als altijd"
        },
        {
          "mine": false,
          "text": "half 7, ik neem het aas mee"
        },
        {
          "mine": true,
          "text": "top, ik zorg voor koffie"
        }
      ]
    },
    {
      "name": "Diana",
      "messages": [
        {
          "mine": false,
          "text": "heb je nog een leuk uitje voor het weekend? kinderen vervelen zich"
        },
        {
          "mine": true,
          "text": "het kinderboerderijtje is altijd leuk"
        },
        {
          "mine": false,
          "text": "goed idee, is die open op zondag?"
        },
        {
          "mine": true,
          "text": "ja tot 5 uur geloof ik"
        },
        {
          "mine": false,
          "text": "top, gaan we doen, dank"
        }
      ]
    },
    {
      "name": "Melvin",
      "messages": [
        {
          "mine": true,
          "text": "kun je me helpen met mijn cv opmaken? jij bent daar goed in"
        },
        {
          "mine": false,
          "text": "ja hoor, stuur maar door dan kijk ik ernaar"
        },
        {
          "mine": true,
          "text": "top, ik mail em vanavond"
        },
        {
          "mine": false,
          "text": "prima, ik geef je feedback"
        },
        {
          "mine": true,
          "text": "super bedankt"
        }
      ]
    },
    {
      "name": "Astrid",
      "messages": [
        {
          "mine": false,
          "text": "gaan we nog samen sinterklaascadeautjes kopen?"
        },
        {
          "mine": true,
          "text": "ja goed idee, zaterdag naar de stad?"
        },
        {
          "mine": false,
          "text": "prima, half 11 bij het station?"
        },
        {
          "mine": true,
          "text": "top, dan lunchen we ook even"
        },
        {
          "mine": false,
          "text": "gezellig, tot zaterdag"
        }
      ]
    },
    {
      "name": "Bart",
      "messages": [
        {
          "mine": true,
          "text": "de kraan in de keuken druppelt, weet jij hoe je em maakt?"
        },
        {
          "mine": false,
          "text": "ja meestal is het het ringetje binnenin"
        },
        {
          "mine": true,
          "text": "kan ik dat zelf?"
        },
        {
          "mine": false,
          "text": "ja hoor, kraan dicht, dopje eraf, ringetje vervangen"
        },
        {
          "mine": true,
          "text": "top ga ik proberen, dank"
        }
      ]
    },
    {
      "name": "Naomi",
      "messages": [
        {
          "mine": false,
          "text": "kom je zaterdag naar mijn housewarming?"
        },
        {
          "mine": true,
          "text": "ja leuk! hoe laat en wat neem ik mee"
        },
        {
          "mine": false,
          "text": "vanaf 4 uur, gewoon jezelf haha"
        },
        {
          "mine": true,
          "text": "haha oke ik neem toch wat te drinken mee"
        },
        {
          "mine": false,
          "text": "top, tot zaterdag"
        }
      ]
    },
    {
      "name": "Werk Sandra",
      "messages": [
        {
          "mine": true,
          "text": "heb jij de sleutel van de voorraadkast?"
        },
        {
          "mine": false,
          "text": "ja die hangt bij mij, kom maar halen"
        },
        {
          "mine": true,
          "text": "top, ik moet nieuwe pennen pakken"
        },
        {
          "mine": false,
          "text": "ligt allemaal op de onderste plank"
        },
        {
          "mine": true,
          "text": "dank je"
        }
      ]
    },
    {
      "name": "Coen",
      "messages": [
        {
          "mine": false,
          "text": "gaan we nog een keer klimmen in die hal?"
        },
        {
          "mine": true,
          "text": "ja leuk! ben er aan toe"
        },
        {
          "mine": false,
          "text": "vrijdagavond? rond 7"
        },
        {
          "mine": true,
          "text": "prima, ik huur schoenen daar"
        },
        {
          "mine": false,
          "text": "top, tot vrijdag"
        }
      ]
    },
    {
      "name": "Marjolein",
      "messages": [
        {
          "mine": true,
          "text": "heb je nog een goed recept voor een simpele soep?"
        },
        {
          "mine": false,
          "text": "tomatensoep! ui, knoflook, blik tomaten, bouillon"
        },
        {
          "mine": true,
          "text": "klinkt makkelijk, hoe lang koken?"
        },
        {
          "mine": false,
          "text": "20 minuutjes, dan pureren"
        },
        {
          "mine": true,
          "text": "top ga ik vanavond maken"
        }
      ]
    }
  ],
  "pl": [
    {
      "name": "Mama",
      "messages": [
        {
          "mine": false,
          "text": "kupisz po drodze chleb i mleko?"
        },
        {
          "mine": true,
          "text": "jasne, jeszcze cos?"
        },
        {
          "mine": false,
          "text": "moze jajka, jak sa swieze"
        },
        {
          "mine": true,
          "text": "ok wezme dziesiec"
        },
        {
          "mine": false,
          "text": "dziekuje kochanie, obiad o 15"
        },
        {
          "mine": true,
          "text": "bede na czas"
        }
      ]
    },
    {
      "name": "Tata",
      "messages": [
        {
          "mine": true,
          "text": "tato pomozesz mi w niedziele z autem?"
        },
        {
          "mine": false,
          "text": "co sie dzieje?"
        },
        {
          "mine": true,
          "text": "cos stuka z przodu jak hamuje"
        },
        {
          "mine": false,
          "text": "pewnie klocki, przyjedz rano zerkniemy"
        },
        {
          "mine": true,
          "text": "dzieki, bede kolo dziewiatej"
        }
      ]
    },
    {
      "name": "Babcia",
      "messages": [
        {
          "mine": false,
          "text": "wnusiu przyjedziesz w niedziele na rosol?"
        },
        {
          "mine": true,
          "text": "przyjade babciu, o ktorej?"
        },
        {
          "mine": false,
          "text": "kolo pierwszej, upieke tez sernik"
        },
        {
          "mine": true,
          "text": "uwielbiam twoj sernik"
        },
        {
          "mine": false,
          "text": "to czekam, uwazaj na siebie"
        }
      ]
    },
    {
      "name": "Kasia",
      "messages": [
        {
          "mine": true,
          "text": "hej idziemy jutro na kawe?"
        },
        {
          "mine": false,
          "text": "moge o 16 po pracy"
        },
        {
          "mine": true,
          "text": "to nasza ulubiona kawiarnia?"
        },
        {
          "mine": false,
          "text": "moze ta nowa przy rynku"
        },
        {
          "mine": true,
          "text": "dobra, ciekawe jak tam"
        },
        {
          "mine": false,
          "text": "to do jutra, biegne na spotkanie"
        }
      ]
    },
    {
      "name": "Piotrek",
      "messages": [
        {
          "mine": false,
          "text": "gramy w sobote w pilke?"
        },
        {
          "mine": true,
          "text": "o ktorej i gdzie?"
        },
        {
          "mine": false,
          "text": "orlik przy szkole, 10 rano"
        },
        {
          "mine": true,
          "text": "bede, wezme wode dla wszystkich"
        },
        {
          "mine": false,
          "text": "spoko, ja pilke"
        }
      ]
    },
    {
      "name": "Ania z pracy",
      "messages": [
        {
          "mine": false,
          "text": "przesuwamy spotkanie na 11?"
        },
        {
          "mine": true,
          "text": "moge, mam wtedy wolne"
        },
        {
          "mine": false,
          "text": "super, sala numer 3"
        },
        {
          "mine": true,
          "text": "biore laptopa i notatki"
        },
        {
          "mine": false,
          "text": "dzieki, do zobaczenia"
        }
      ]
    },
    {
      "name": "Marek",
      "messages": [
        {
          "mine": true,
          "text": "oddasz mi ta wiertarke?"
        },
        {
          "mine": false,
          "text": "aa racja, mam ja jeszcze"
        },
        {
          "mine": true,
          "text": "przyda mi sie w weekend, wiesze polki"
        },
        {
          "mine": false,
          "text": "podrzuce ci jutro wieczorem"
        },
        {
          "mine": true,
          "text": "dzieki wielkie"
        }
      ]
    },
    {
      "name": "Zosia",
      "messages": [
        {
          "mine": false,
          "text": "masz przepis na te ciasto marchewkowe?"
        },
        {
          "mine": true,
          "text": "mam, wysle ci zdjecie kartki"
        },
        {
          "mine": false,
          "text": "dzieki, chce zrobic na urodziny mamy"
        },
        {
          "mine": true,
          "text": "dodaj wiecej cynamonu, wychodzi lepsze"
        },
        {
          "mine": false,
          "text": "o dobra rada, sprobuje"
        }
      ]
    },
    {
      "name": "Wujek Janek",
      "messages": [
        {
          "mine": false,
          "text": "bedziesz na imieninach cioci?"
        },
        {
          "mine": true,
          "text": "kiedy dokladnie?"
        },
        {
          "mine": false,
          "text": "w sobote od 14"
        },
        {
          "mine": true,
          "text": "postaram sie wpasc na chwile"
        },
        {
          "mine": false,
          "text": "bylo by milo, dawno cie nie widzielismy"
        }
      ]
    },
    {
      "name": "Ola",
      "messages": [
        {
          "mine": true,
          "text": "widzialas jaka dzis pogoda?"
        },
        {
          "mine": false,
          "text": "leje jak z cebra od rana"
        },
        {
          "mine": true,
          "text": "wzialam parasol i tak przemoklam"
        },
        {
          "mine": false,
          "text": "podobno jutro ma byc slonce"
        },
        {
          "mine": true,
          "text": "oby, mam pranie do wywieszenia"
        }
      ]
    },
    {
      "name": "Tomek sasiad",
      "messages": [
        {
          "mine": false,
          "text": "przyszla do ciebie paczka, mam ja u siebie"
        },
        {
          "mine": true,
          "text": "o super, dzieki ze odebrales"
        },
        {
          "mine": false,
          "text": "kurier zostawil bo cie nie bylo"
        },
        {
          "mine": true,
          "text": "wpadne wieczorem po nia, ok?"
        },
        {
          "mine": false,
          "text": "spoko, jestem w domu"
        }
      ]
    },
    {
      "name": "Magda",
      "messages": [
        {
          "mine": true,
          "text": "co u ciebie? dawno sie nie slyszalysmy"
        },
        {
          "mine": false,
          "text": "wszystko dobrze, remont w kuchni sie skonczyl"
        },
        {
          "mine": true,
          "text": "o pokaz zdjecia jak gotowe"
        },
        {
          "mine": false,
          "text": "jasne, jeszcze malujemy sciane"
        },
        {
          "mine": true,
          "text": "musimy sie spotkac na kawe"
        },
        {
          "mine": false,
          "text": "koniecznie, moze przyszly tydzien"
        }
      ]
    },
    {
      "name": "Krzysiek",
      "messages": [
        {
          "mine": false,
          "text": "podwiozesz mnie jutro na dworzec?"
        },
        {
          "mine": true,
          "text": "o ktorej masz pociag?"
        },
        {
          "mine": false,
          "text": "8:20, wiec kolo 7:50 z domu"
        },
        {
          "mine": true,
          "text": "ok bede pod blokiem 7:45"
        },
        {
          "mine": false,
          "text": "super, jestem ci winien kawe"
        }
      ]
    },
    {
      "name": "Dentysta",
      "messages": [
        {
          "mine": false,
          "text": "przypominamy o wizycie jutro o 12:30"
        },
        {
          "mine": true,
          "text": "dziekuje, bede"
        },
        {
          "mine": false,
          "text": "prosze przyjsc 10 min wczesniej"
        },
        {
          "mine": true,
          "text": "ok, do jutra"
        }
      ]
    },
    {
      "name": "Fryzjer Ela",
      "messages": [
        {
          "mine": true,
          "text": "czy jest wolny termin w sobote?"
        },
        {
          "mine": false,
          "text": "moge o 10 albo o 14"
        },
        {
          "mine": true,
          "text": "wezme te 10, samo strzyzenie"
        },
        {
          "mine": false,
          "text": "zapisane, do zobaczenia"
        },
        {
          "mine": true,
          "text": "dzieki bardzo"
        }
      ]
    },
    {
      "name": "Grzesiek",
      "messages": [
        {
          "mine": false,
          "text": "masz moze skoczyc na grilla w sobote?"
        },
        {
          "mine": true,
          "text": "chetnie, co przyniesc?"
        },
        {
          "mine": false,
          "text": "moze salatke i cos do picia"
        },
        {
          "mine": true,
          "text": "zrobie te z fety i pomidorow"
        },
        {
          "mine": false,
          "text": "o tak, wszyscy ja lubia"
        },
        {
          "mine": true,
          "text": "to widzimy sie kolo 15"
        }
      ]
    },
    {
      "name": "Justyna",
      "messages": [
        {
          "mine": true,
          "text": "maly ma jutro wywiadowke, idziesz?"
        },
        {
          "mine": false,
          "text": "o ktorej?"
        },
        {
          "mine": true,
          "text": "17:30 w jego klasie"
        },
        {
          "mine": false,
          "text": "bede, wychodze wczesniej z pracy"
        },
        {
          "mine": true,
          "text": "to spotkajmy sie przy wejsciu"
        }
      ]
    },
    {
      "name": "Mechanik Rysiek",
      "messages": [
        {
          "mine": true,
          "text": "panie ryszardzie auto gotowe?"
        },
        {
          "mine": false,
          "text": "tak, wymienilem klocki i tarcze"
        },
        {
          "mine": true,
          "text": "moge odebrac dzis?"
        },
        {
          "mine": false,
          "text": "do 17 jestem w warsztacie"
        },
        {
          "mine": true,
          "text": "bede kolo 16, dziekuje"
        }
      ]
    },
    {
      "name": "Natalia",
      "messages": [
        {
          "mine": false,
          "text": "idziemy w niedziele na spacer nad rzeke?"
        },
        {
          "mine": true,
          "text": "chetnie, jak pogoda dopisze"
        },
        {
          "mine": false,
          "text": "ma byc slonecznie i cieplo"
        },
        {
          "mine": true,
          "text": "to wezme termos z herbata"
        },
        {
          "mine": false,
          "text": "a ja cos slodkiego"
        }
      ]
    },
    {
      "name": "Pawel",
      "messages": [
        {
          "mine": true,
          "text": "stary pozyczysz mi kosiarke?"
        },
        {
          "mine": false,
          "text": "jasne, kiedy potrzebujesz?"
        },
        {
          "mine": true,
          "text": "na weekend, trawa urosla strasznie"
        },
        {
          "mine": false,
          "text": "wpadnij w piatek wieczorem"
        },
        {
          "mine": true,
          "text": "dzieki, oddam z pelnym bakiem"
        }
      ]
    },
    {
      "name": "Ciocia Halina",
      "messages": [
        {
          "mine": false,
          "text": "jak sie miewasz kochanie?"
        },
        {
          "mine": true,
          "text": "dobrze ciociu, duzo pracy"
        },
        {
          "mine": false,
          "text": "odpoczywaj tez czasem"
        },
        {
          "mine": true,
          "text": "staram sie, w weekend wypoczne"
        },
        {
          "mine": false,
          "text": "wpadnij na obiad jak bedziesz mogl"
        }
      ]
    },
    {
      "name": "Dorota",
      "messages": [
        {
          "mine": true,
          "text": "masz liste zakupow na impreze?"
        },
        {
          "mine": false,
          "text": "tak, napoje, przekaski, cos na cieplo"
        },
        {
          "mine": true,
          "text": "ja wezme napoje i lod"
        },
        {
          "mine": false,
          "text": "to ja zrobie zapiekanki"
        },
        {
          "mine": true,
          "text": "super, reszte kupimy na miejscu"
        }
      ]
    },
    {
      "name": "Bartek",
      "messages": [
        {
          "mine": false,
          "text": "ogladales mecz wczoraj?"
        },
        {
          "mine": true,
          "text": "tak, koncowka byla mocna"
        },
        {
          "mine": false,
          "text": "ten gol w 90 minucie, masakra"
        },
        {
          "mine": true,
          "text": "az podskoczylem z kanapy"
        },
        {
          "mine": false,
          "text": "nastepny w sobote, ogladamy razem?"
        },
        {
          "mine": true,
          "text": "jasne, u mnie z pizza"
        }
      ]
    },
    {
      "name": "Weronika",
      "messages": [
        {
          "mine": true,
          "text": "kupilam nowe zaslony do salonu"
        },
        {
          "mine": false,
          "text": "o jaki kolor?"
        },
        {
          "mine": true,
          "text": "beżowe, pasuja do kanapy"
        },
        {
          "mine": false,
          "text": "brzmi przytulnie, pokaz jak zawiesisz"
        },
        {
          "mine": true,
          "text": "jutro to zrobie, wysle foto"
        }
      ]
    },
    {
      "name": "Michal",
      "messages": [
        {
          "mine": false,
          "text": "pomozesz mi przeniesc szafe w sobote?"
        },
        {
          "mine": true,
          "text": "ciezka?"
        },
        {
          "mine": false,
          "text": "srednio, ale sam nie dam rady"
        },
        {
          "mine": true,
          "text": "spoko wpadne rano"
        },
        {
          "mine": false,
          "text": "dzieki, postawie za to obiad"
        }
      ]
    },
    {
      "name": "Iza",
      "messages": [
        {
          "mine": true,
          "text": "gdzie kupilas te buty? super wygladaja"
        },
        {
          "mine": false,
          "text": "w tym sklepie w galerii"
        },
        {
          "mine": true,
          "text": "byly drogie?"
        },
        {
          "mine": false,
          "text": "byla promka, wziełam za pol ceny"
        },
        {
          "mine": true,
          "text": "musze tam zajrzec w weekend"
        }
      ]
    },
    {
      "name": "Dziadek",
      "messages": [
        {
          "mine": false,
          "text": "przyjedziesz mi pomoc w ogrodku?"
        },
        {
          "mine": true,
          "text": "co trzeba zrobic dziadku?"
        },
        {
          "mine": false,
          "text": "posadzic pomidory i podlac"
        },
        {
          "mine": true,
          "text": "przyjade w sobote rano"
        },
        {
          "mine": false,
          "text": "to dobrze, zrobie ci jajecznice"
        }
      ]
    },
    {
      "name": "Karolina",
      "messages": [
        {
          "mine": false,
          "text": "masz czas w czwartek na joge?"
        },
        {
          "mine": true,
          "text": "o ktorej zajecia?"
        },
        {
          "mine": false,
          "text": "18, ta sama sala co zawsze"
        },
        {
          "mine": true,
          "text": "bede, wezme mate"
        },
        {
          "mine": false,
          "text": "to trzymam ci miejsce"
        }
      ]
    },
    {
      "name": "Adam",
      "messages": [
        {
          "mine": true,
          "text": "kiedy oddasz mi ksiazke?"
        },
        {
          "mine": false,
          "text": "aa juz doczytalem, oddam jutro"
        },
        {
          "mine": true,
          "text": "i jak? warto?"
        },
        {
          "mine": false,
          "text": "super, koncowka zaskakuje"
        },
        {
          "mine": true,
          "text": "to nie mow nic wiecej, chce sama przeczytac"
        }
      ]
    },
    {
      "name": "Ewa",
      "messages": [
        {
          "mine": false,
          "text": "robisz cos na obiad jutro?"
        },
        {
          "mine": true,
          "text": "myslalam o schabowym"
        },
        {
          "mine": false,
          "text": "o to wpadne z dzieciakami"
        },
        {
          "mine": true,
          "text": "super, zrobie wiecej ziemniakow"
        },
        {
          "mine": false,
          "text": "przyniose kompot"
        }
      ]
    },
    {
      "name": "Szymon",
      "messages": [
        {
          "mine": false,
          "text": "zmienilismy termin treningu na wtorek"
        },
        {
          "mine": true,
          "text": "ta sama godzina?"
        },
        {
          "mine": false,
          "text": "tak, 19 na hali"
        },
        {
          "mine": true,
          "text": "ok bede, dzieki za info"
        }
      ]
    },
    {
      "name": "Basia",
      "messages": [
        {
          "mine": true,
          "text": "podrzucisz cos na kiermasz w szkole?"
        },
        {
          "mine": false,
          "text": "moge upiec babeczki"
        },
        {
          "mine": true,
          "text": "super, ile dasz rady?"
        },
        {
          "mine": false,
          "text": "ze dwie tace"
        },
        {
          "mine": true,
          "text": "cudownie, dzieci sie ucieszą"
        }
      ]
    },
    {
      "name": "Robert",
      "messages": [
        {
          "mine": false,
          "text": "jedziesz jutro do pracy autem?"
        },
        {
          "mine": true,
          "text": "tak, podwiezc cie?"
        },
        {
          "mine": false,
          "text": "byloby super, mam samochod w serwisie"
        },
        {
          "mine": true,
          "text": "bede pod twoim blokiem 7:30"
        },
        {
          "mine": false,
          "text": "dzieki ratujesz mi dzien"
        }
      ]
    },
    {
      "name": "Monika",
      "messages": [
        {
          "mine": true,
          "text": "co kupic maluchowi na urodziny?"
        },
        {
          "mine": false,
          "text": "on teraz uwielbia klocki"
        },
        {
          "mine": true,
          "text": "o to dobry pomysl"
        },
        {
          "mine": false,
          "text": "albo ksiazeczki z dzwiekami"
        },
        {
          "mine": true,
          "text": "wezme jedno i drugie"
        }
      ]
    },
    {
      "name": "Lukasz",
      "messages": [
        {
          "mine": false,
          "text": "masz moze druga drabine?"
        },
        {
          "mine": true,
          "text": "mam, po co ci?"
        },
        {
          "mine": false,
          "text": "chce pomalowac sufit"
        },
        {
          "mine": true,
          "text": "wpadnij po nia kiedy chcesz"
        },
        {
          "mine": false,
          "text": "dzieki, wpadne wieczorem"
        }
      ]
    },
    {
      "name": "Gosia",
      "messages": [
        {
          "mine": false,
          "text": "widzimy sie na kawie w piatek?"
        },
        {
          "mine": true,
          "text": "jasne, o ktorej?"
        },
        {
          "mine": false,
          "text": "kolo 17 mi pasuje"
        },
        {
          "mine": true,
          "text": "to samo miejsce co zawsze"
        },
        {
          "mine": false,
          "text": "super, mam ci duzo do opowiedzenia"
        }
      ]
    },
    {
      "name": "Wojtek",
      "messages": [
        {
          "mine": true,
          "text": "idziesz jutro na basen?"
        },
        {
          "mine": false,
          "text": "moge, o ktorej?"
        },
        {
          "mine": true,
          "text": "rano kolo 9, mniej ludzi"
        },
        {
          "mine": false,
          "text": "ok, spotkajmy sie przy kasach"
        },
        {
          "mine": true,
          "text": "biore czepek i okulary"
        }
      ]
    },
    {
      "name": "Pani Krysia",
      "messages": [
        {
          "mine": false,
          "text": "moze pan podlac kwiaty jak wyjezdzam?"
        },
        {
          "mine": true,
          "text": "oczywiscie, kiedy pani wraca?"
        },
        {
          "mine": false,
          "text": "za tydzien, klucz zostawie u sasiadki"
        },
        {
          "mine": true,
          "text": "spoko, bede podlewal co drugi dzien"
        },
        {
          "mine": false,
          "text": "bardzo dziekuje, jest pan kochany"
        }
      ]
    },
    {
      "name": "Kuba",
      "messages": [
        {
          "mine": false,
          "text": "wpadniesz obejrzec film w piatek?"
        },
        {
          "mine": true,
          "text": "co ogladamy?"
        },
        {
          "mine": false,
          "text": "cos nowego, ty wybierz"
        },
        {
          "mine": true,
          "text": "to jakis kryminal"
        },
        {
          "mine": false,
          "text": "moze byc, robie popcorn"
        }
      ]
    },
    {
      "name": "Sylwia",
      "messages": [
        {
          "mine": true,
          "text": "masz numer do tego hydraulika?"
        },
        {
          "mine": false,
          "text": "mam, zaraz ci wysle"
        },
        {
          "mine": true,
          "text": "kapie mi pod zlewem"
        },
        {
          "mine": false,
          "text": "on szybko przyjezdza, polecam"
        },
        {
          "mine": true,
          "text": "dzieki, zadzwonie od razu"
        }
      ]
    },
    {
      "name": "Filip",
      "messages": [
        {
          "mine": false,
          "text": "grasz wieczorem online?"
        },
        {
          "mine": true,
          "text": "moge kolo 20"
        },
        {
          "mine": false,
          "text": "to zapraszam do druzyny"
        },
        {
          "mine": true,
          "text": "ostatnio slabo mi szlo haha"
        },
        {
          "mine": false,
          "text": "poprawimy sie, do wieczora"
        }
      ]
    },
    {
      "name": "Renata",
      "messages": [
        {
          "mine": true,
          "text": "kupilas juz prezent dla taty?"
        },
        {
          "mine": false,
          "text": "jeszcze nie, mam pustke w glowie"
        },
        {
          "mine": true,
          "text": "moze cieple kapcie? on ciagle marznie"
        },
        {
          "mine": false,
          "text": "o dobry pomysl, dzieki"
        },
        {
          "mine": true,
          "text": "to skladamy sie po polowie?"
        }
      ]
    },
    {
      "name": "Marcin",
      "messages": [
        {
          "mine": false,
          "text": "podrzucisz dzieciaki jutro do szkoly?"
        },
        {
          "mine": true,
          "text": "moge, o ktorej zaczynaja?"
        },
        {
          "mine": false,
          "text": "8, wystarczy 7:40 z domu"
        },
        {
          "mine": true,
          "text": "spoko, bede pod domem"
        },
        {
          "mine": false,
          "text": "ratujesz mi tylek, dzieki"
        }
      ]
    },
    {
      "name": "Agnieszka",
      "messages": [
        {
          "mine": true,
          "text": "byłas juz u nowego lekarza?"
        },
        {
          "mine": false,
          "text": "tak, mila pani, poleciła witamine d"
        },
        {
          "mine": true,
          "text": "o musze tez zapisac sie na kontrole"
        },
        {
          "mine": false,
          "text": "zapisy sa online, latwo"
        },
        {
          "mine": true,
          "text": "dzieki, sprobuje wieczorem"
        }
      ]
    },
    {
      "name": "Rafal",
      "messages": [
        {
          "mine": false,
          "text": "masz ochote na rower w niedziele?"
        },
        {
          "mine": true,
          "text": "gdzie jedziemy?"
        },
        {
          "mine": false,
          "text": "ta trasa nad jeziorem, ladnie tam"
        },
        {
          "mine": true,
          "text": "wchodze w to, ile km?"
        },
        {
          "mine": false,
          "text": "kolo 20, spokojne tempo"
        },
        {
          "mine": true,
          "text": "idealnie, wezme wode"
        }
      ]
    },
    {
      "name": "Beata",
      "messages": [
        {
          "mine": true,
          "text": "jak minela wizyta u weterynarza?"
        },
        {
          "mine": false,
          "text": "dobrze, tylko szczepienie"
        },
        {
          "mine": true,
          "text": "a jak sie czuje kotek?"
        },
        {
          "mine": false,
          "text": "spi caly dzien, ale je normalnie"
        },
        {
          "mine": true,
          "text": "to dobrze, ucałuj go ode mnie"
        }
      ]
    },
    {
      "name": "Damian",
      "messages": [
        {
          "mine": false,
          "text": "zmiana w grafiku, robisz w sobote?"
        },
        {
          "mine": true,
          "text": "mialem wolne, cos sie stalo?"
        },
        {
          "mine": false,
          "text": "kolega zachorowal, potrzebne zastepstwo"
        },
        {
          "mine": true,
          "text": "moge wejsc na rano do 14"
        },
        {
          "mine": false,
          "text": "super ratujesz, dopisze cie"
        }
      ]
    },
    {
      "name": "Kinga",
      "messages": [
        {
          "mine": true,
          "text": "co robisz na weekend?"
        },
        {
          "mine": false,
          "text": "chyba porzadki i odpoczynek"
        },
        {
          "mine": true,
          "text": "moze wpadniesz na herbate?"
        },
        {
          "mine": false,
          "text": "chetnie, w niedziele po poludniu"
        },
        {
          "mine": true,
          "text": "to czekam, upiekę cos"
        }
      ]
    },
    {
      "name": "Przemek",
      "messages": [
        {
          "mine": false,
          "text": "oddam ci te 50 zl jutro dobra?"
        },
        {
          "mine": true,
          "text": "spoko, nie ma pospiechu"
        },
        {
          "mine": false,
          "text": "wole oddac od razu"
        },
        {
          "mine": true,
          "text": "to dzieki, wpadnij na kawe przy okazji"
        },
        {
          "mine": false,
          "text": "moze byc, do jutra"
        }
      ]
    },
    {
      "name": "Alicja",
      "messages": [
        {
          "mine": true,
          "text": "masz sprawdzian z dzieckiem na jutro?"
        },
        {
          "mine": false,
          "text": "tak, matematyka, powtarzamy ulamki"
        },
        {
          "mine": true,
          "text": "u nas przyroda, o roslinach"
        },
        {
          "mine": false,
          "text": "trzymam kciuki za maluchow"
        },
        {
          "mine": true,
          "text": "dzieki, damy rade"
        }
      ]
    },
    {
      "name": "Sebastian",
      "messages": [
        {
          "mine": false,
          "text": "spotkanie zespolu przesuniete na 14"
        },
        {
          "mine": true,
          "text": "ok, ta sama sala?"
        },
        {
          "mine": false,
          "text": "tak, przynies raport"
        },
        {
          "mine": true,
          "text": "juz go koncze, bedzie gotowy"
        },
        {
          "mine": false,
          "text": "super, dzieki"
        }
      ]
    },
    {
      "name": "Patrycja",
      "messages": [
        {
          "mine": true,
          "text": "kupilam skladniki na pierogi"
        },
        {
          "mine": false,
          "text": "z czym robisz?"
        },
        {
          "mine": true,
          "text": "z kapusta i grzybami"
        },
        {
          "mine": false,
          "text": "moje ulubione, zostaw mi kilka"
        },
        {
          "mine": true,
          "text": "jasne, wpadnij wieczorem"
        }
      ]
    },
    {
      "name": "Darek",
      "messages": [
        {
          "mine": false,
          "text": "masz jutro czas na naprawe kranu?"
        },
        {
          "mine": true,
          "text": "moge wpasc po 17"
        },
        {
          "mine": false,
          "text": "super, kupilem juz uszczelke"
        },
        {
          "mine": true,
          "text": "to bedzie szybko, wezme klucze"
        },
        {
          "mine": false,
          "text": "dzieki wielkie stary"
        }
      ]
    },
    {
      "name": "Joanna",
      "messages": [
        {
          "mine": true,
          "text": "idziemy jutro na zakupy do galerii?"
        },
        {
          "mine": false,
          "text": "moge po 12"
        },
        {
          "mine": true,
          "text": "szukam kurtki na jesien"
        },
        {
          "mine": false,
          "text": "ja tez, pomozemy sobie wybrac"
        },
        {
          "mine": true,
          "text": "to spotkajmy sie przy fontannie"
        }
      ]
    },
    {
      "name": "Norbert",
      "messages": [
        {
          "mine": false,
          "text": "przyjedziesz pomoc przy przeprowadzce?"
        },
        {
          "mine": true,
          "text": "kiedy sie przeprowadzasz?"
        },
        {
          "mine": false,
          "text": "za dwa tygodnie w sobote"
        },
        {
          "mine": true,
          "text": "zapisuje sobie, przyjade z busem"
        },
        {
          "mine": false,
          "text": "jestes wielki, dziekuje"
        }
      ]
    },
    {
      "name": "Klaudia",
      "messages": [
        {
          "mine": true,
          "text": "polecisz jakis dobry serial?"
        },
        {
          "mine": false,
          "text": "ostatnio ogladalam fajny o gotowaniu"
        },
        {
          "mine": true,
          "text": "o to lubie, jak sie nazywa?"
        },
        {
          "mine": false,
          "text": "wysle ci link wieczorem"
        },
        {
          "mine": true,
          "text": "dzieki, wieczor mam zajety haha"
        }
      ]
    },
    {
      "name": "Mateusz",
      "messages": [
        {
          "mine": false,
          "text": "wpadniesz pomoc zlozyc meble z paczki?"
        },
        {
          "mine": true,
          "text": "jasne, lubie takie klocki dla doroslych"
        },
        {
          "mine": false,
          "text": "szafka i komoda, instrukcja jest"
        },
        {
          "mine": true,
          "text": "wpadne w niedziele rano"
        },
        {
          "mine": false,
          "text": "super, kawa z domu"
        }
      ]
    },
    {
      "name": "Emilia",
      "messages": [
        {
          "mine": true,
          "text": "masz moze przepis na zupe pomidorowa?"
        },
        {
          "mine": false,
          "text": "mam, robisz na wywarze?"
        },
        {
          "mine": true,
          "text": "tak, z kury"
        },
        {
          "mine": false,
          "text": "dodaj lyzke smietany na koniec"
        },
        {
          "mine": true,
          "text": "dzieki, brzmi pysznie"
        }
      ]
    },
    {
      "name": "Arek",
      "messages": [
        {
          "mine": false,
          "text": "jedziemy na dzialke w weekend?"
        },
        {
          "mine": true,
          "text": "trzeba cos zrobic?"
        },
        {
          "mine": false,
          "text": "skosic trawe i zebrac liscie"
        },
        {
          "mine": true,
          "text": "spoko, wezme grabie"
        },
        {
          "mine": false,
          "text": "a ja zrobie ognisko potem"
        }
      ]
    },
    {
      "name": "Martyna",
      "messages": [
        {
          "mine": true,
          "text": "widzialas jaki korek na obwodnicy?"
        },
        {
          "mine": false,
          "text": "tak, stoje juz 20 minut"
        },
        {
          "mine": true,
          "text": "chyba wypadek gdzies z przodu"
        },
        {
          "mine": false,
          "text": "spoznie sie na spotkanie"
        },
        {
          "mine": true,
          "text": "napisz ze utknelas, zrozumieja"
        }
      ]
    },
    {
      "name": "Igor",
      "messages": [
        {
          "mine": false,
          "text": "masz ladowarke do telefonu na pozyczke?"
        },
        {
          "mine": true,
          "text": "mam, jaki masz kabel?"
        },
        {
          "mine": false,
          "text": "usb c"
        },
        {
          "mine": true,
          "text": "podrzuce ci na przerwie"
        },
        {
          "mine": false,
          "text": "ratujesz, padam mi na 3 procentach"
        }
      ]
    },
    {
      "name": "Wiola",
      "messages": [
        {
          "mine": true,
          "text": "co u malej w przedszkolu?"
        },
        {
          "mine": false,
          "text": "wszystko ok, dzis malowali"
        },
        {
          "mine": true,
          "text": "przyniosla jakis obrazek?"
        },
        {
          "mine": false,
          "text": "tak, sloneczko, powiesilam na lodowce"
        },
        {
          "mine": true,
          "text": "aww, musze zobaczyc"
        }
      ]
    },
    {
      "name": "Konrad",
      "messages": [
        {
          "mine": false,
          "text": "idziemy na piwo bezalko po pracy?"
        },
        {
          "mine": true,
          "text": "moge, ale tylko na godzinke"
        },
        {
          "mine": false,
          "text": "spoko, ten bar przy parku"
        },
        {
          "mine": true,
          "text": "ok, do zobaczenia o 18"
        },
        {
          "mine": false,
          "text": "trzymam stolik"
        }
      ]
    },
    {
      "name": "Sandra",
      "messages": [
        {
          "mine": true,
          "text": "masz jeszcze te forme do ciasta?"
        },
        {
          "mine": false,
          "text": "mam, przyjdz kiedy chcesz"
        },
        {
          "mine": true,
          "text": "chce zrobic szarlotke na niedziele"
        },
        {
          "mine": false,
          "text": "o pyszne, zostaw kawalek"
        },
        {
          "mine": true,
          "text": "obiecuje, wpadne dzis wieczorem"
        }
      ]
    },
    {
      "name": "Bartosz",
      "messages": [
        {
          "mine": false,
          "text": "kiedy masz przeglad auta?"
        },
        {
          "mine": true,
          "text": "za dwa tygodnie, czemu?"
        },
        {
          "mine": false,
          "text": "znam dobry warsztat, tanio robia"
        },
        {
          "mine": true,
          "text": "podeslij namiar"
        },
        {
          "mine": false,
          "text": "juz wysylam, powiedz ze od Bartka"
        }
      ]
    },
    {
      "name": "Aneta",
      "messages": [
        {
          "mine": true,
          "text": "pomozesz mi wybrac farbe do pokoju?"
        },
        {
          "mine": false,
          "text": "jasne, jaki klimat chcesz?"
        },
        {
          "mine": true,
          "text": "cos jasnego, moze szarosc"
        },
        {
          "mine": false,
          "text": "szarosc z odrobina bieli bedzie super"
        },
        {
          "mine": true,
          "text": "to jedziemy razem do sklepu?"
        },
        {
          "mine": false,
          "text": "moge w sobote"
        }
      ]
    },
    {
      "name": "Jacek",
      "messages": [
        {
          "mine": false,
          "text": "masz jakis dobry film na wieczor?"
        },
        {
          "mine": true,
          "text": "obejrzyj ten komediowy co polecalem"
        },
        {
          "mine": false,
          "text": "ten o wakacjach?"
        },
        {
          "mine": true,
          "text": "tak, ubawisz sie"
        },
        {
          "mine": false,
          "text": "to wlaczam, dzieki"
        }
      ]
    },
    {
      "name": "Ola z bloku",
      "messages": [
        {
          "mine": false,
          "text": "jutro myja klatke, uwazaj na mokro"
        },
        {
          "mine": true,
          "text": "dzieki za info"
        },
        {
          "mine": true,
          "text": "o ktorej mniej wiecej?"
        },
        {
          "mine": false,
          "text": "rano, kolo 9"
        },
        {
          "mine": true,
          "text": "to zejde wczesniej z psem"
        }
      ]
    },
    {
      "name": "Radek",
      "messages": [
        {
          "mine": true,
          "text": "kiedy oddasz mi ten glosnik?"
        },
        {
          "mine": false,
          "text": "aa mam go, potrzebujesz?"
        },
        {
          "mine": true,
          "text": "tak, robimy urodziny w sobote"
        },
        {
          "mine": false,
          "text": "przywioze w piatek, spoko"
        },
        {
          "mine": true,
          "text": "super, dzieki"
        }
      ]
    },
    {
      "name": "Marta",
      "messages": [
        {
          "mine": false,
          "text": "spotkamy sie w parku z dziecmi?"
        },
        {
          "mine": true,
          "text": "chetnie, kolo 15?"
        },
        {
          "mine": false,
          "text": "moze byc, przy placu zabaw"
        },
        {
          "mine": true,
          "text": "wezme kanapki dla wszystkich"
        },
        {
          "mine": false,
          "text": "a ja sok, do zobaczenia"
        }
      ]
    },
    {
      "name": "Piotr sasiad",
      "messages": [
        {
          "mine": true,
          "text": "slyszal pan ten halas wczoraj?"
        },
        {
          "mine": false,
          "text": "tak, chyba ktos robil remont"
        },
        {
          "mine": true,
          "text": "az obrazy sie trzesly"
        },
        {
          "mine": false,
          "text": "podobno koncza w tym tygodniu"
        },
        {
          "mine": true,
          "text": "oby, ciezko sie skupic"
        }
      ]
    },
    {
      "name": "Ula",
      "messages": [
        {
          "mine": false,
          "text": "masz przepis na te salatke grecka?"
        },
        {
          "mine": true,
          "text": "mam, wysle ci zaraz"
        },
        {
          "mine": false,
          "text": "dziekuje, robie na jutro"
        },
        {
          "mine": true,
          "text": "pamietaj o oliwkach i fecie"
        },
        {
          "mine": false,
          "text": "kupione, tylko pomidory zostaly"
        }
      ]
    },
    {
      "name": "Daniel",
      "messages": [
        {
          "mine": false,
          "text": "gramy w kregle w piatek?"
        },
        {
          "mine": true,
          "text": "kto jeszcze idzie?"
        },
        {
          "mine": false,
          "text": "cala paczka, rezerwuje tor"
        },
        {
          "mine": true,
          "text": "wchodze, o ktorej?"
        },
        {
          "mine": false,
          "text": "19, spotkajmy sie wczesniej na kolacje"
        }
      ]
    },
    {
      "name": "Nina",
      "messages": [
        {
          "mine": true,
          "text": "jak tam nowa praca?"
        },
        {
          "mine": false,
          "text": "super, mili ludzie i blisko domu"
        },
        {
          "mine": true,
          "text": "ciesze sie, zaslugujesz"
        },
        {
          "mine": false,
          "text": "musimy to uczcic kawa"
        },
        {
          "mine": true,
          "text": "jasne, wybierz termin"
        }
      ]
    },
    {
      "name": "Tadeusz",
      "messages": [
        {
          "mine": false,
          "text": "przyjdziesz pomoc zrobic drewno na zime?"
        },
        {
          "mine": true,
          "text": "kiedy planujesz?"
        },
        {
          "mine": false,
          "text": "w sobote rano jak ladnie"
        },
        {
          "mine": true,
          "text": "przyjade, wezme rekawice"
        },
        {
          "mine": false,
          "text": "dobrze, zrobimy szybko we dwoch"
        }
      ]
    },
    {
      "name": "Dominika",
      "messages": [
        {
          "mine": true,
          "text": "masz ochote na wspolne gotowanie?"
        },
        {
          "mine": false,
          "text": "o super, co robimy?"
        },
        {
          "mine": true,
          "text": "moze lasagne od zera"
        },
        {
          "mine": false,
          "text": "wchodze, przyniose ser"
        },
        {
          "mine": true,
          "text": "to sobota u mnie, kupie reszte"
        }
      ]
    },
    {
      "name": "Kamil",
      "messages": [
        {
          "mine": false,
          "text": "masz moze pompke do roweru?"
        },
        {
          "mine": true,
          "text": "mam, zlapales gume?"
        },
        {
          "mine": false,
          "text": "chyba tak, przod miekki"
        },
        {
          "mine": true,
          "text": "wpadnij, mam tez laty"
        },
        {
          "mine": false,
          "text": "super, bede za 10 minut"
        }
      ]
    },
    {
      "name": "Iwona",
      "messages": [
        {
          "mine": true,
          "text": "jedziesz jutro na targ?"
        },
        {
          "mine": false,
          "text": "tak, po warzywa i owoce"
        },
        {
          "mine": true,
          "text": "kupisz mi kilo jablek?"
        },
        {
          "mine": false,
          "text": "jasne, jakie lubisz?"
        },
        {
          "mine": true,
          "text": "te kwaskowate na szarlotke"
        },
        {
          "mine": false,
          "text": "biore, oddasz pozniej"
        }
      ]
    },
    {
      "name": "Blazej",
      "messages": [
        {
          "mine": false,
          "text": "masz plany na majowke?"
        },
        {
          "mine": true,
          "text": "chyba zostajemy w domu"
        },
        {
          "mine": false,
          "text": "moze wpadniecie do nas na grilla?"
        },
        {
          "mine": true,
          "text": "chetnie, co przyniesc?"
        },
        {
          "mine": false,
          "text": "cos do picia wystarczy"
        }
      ]
    },
    {
      "name": "Paulina",
      "messages": [
        {
          "mine": true,
          "text": "masz numer do tej pani od sprzatania?"
        },
        {
          "mine": false,
          "text": "mam, solidna, polecam"
        },
        {
          "mine": true,
          "text": "ile bierze za mieszkanie?"
        },
        {
          "mine": false,
          "text": "zalezy od metrazu, dogadacie sie"
        },
        {
          "mine": true,
          "text": "dzieki, zadzwonie"
        }
      ]
    },
    {
      "name": "Oskar",
      "messages": [
        {
          "mine": false,
          "text": "idziesz jutro biegac?"
        },
        {
          "mine": true,
          "text": "moge rano przed praca"
        },
        {
          "mine": false,
          "text": "6:30 nad rzeka?"
        },
        {
          "mine": true,
          "text": "wczesnie ale ok, przyjde"
        },
        {
          "mine": false,
          "text": "to do jutra, ubierz sie cieplo"
        }
      ]
    },
    {
      "name": "Edyta",
      "messages": [
        {
          "mine": true,
          "text": "kupilas juz choinke?"
        },
        {
          "mine": false,
          "text": "jeszcze nie, myslisz o zywej czy sztucznej?"
        },
        {
          "mine": true,
          "text": "u nas zywa, ladnie pachnie"
        },
        {
          "mine": false,
          "text": "racja, tez chyba wezme zywa"
        },
        {
          "mine": true,
          "text": "sa fajne przy tym markecie"
        }
      ]
    },
    {
      "name": "Henryk",
      "messages": [
        {
          "mine": false,
          "text": "syn moze pomoc z komputerem?"
        },
        {
          "mine": true,
          "text": "co sie dzieje panie henryku?"
        },
        {
          "mine": false,
          "text": "wolno chodzi i wyskakuja okienka"
        },
        {
          "mine": true,
          "text": "przyjde wieczorem i zerkne"
        },
        {
          "mine": false,
          "text": "bardzo dziekuje, zrobie herbate"
        }
      ]
    },
    {
      "name": "Roksana",
      "messages": [
        {
          "mine": true,
          "text": "idziemy na manicure w sobote?"
        },
        {
          "mine": false,
          "text": "chetnie, masz termin?"
        },
        {
          "mine": true,
          "text": "zapisze nas na 11"
        },
        {
          "mine": false,
          "text": "super, potem na lunch?"
        },
        {
          "mine": true,
          "text": "jasne, znam fajne miejsce"
        }
      ]
    },
    {
      "name": "Cezary",
      "messages": [
        {
          "mine": false,
          "text": "masz jakis dobry warsztat blacharski?"
        },
        {
          "mine": true,
          "text": "obtareles auto?"
        },
        {
          "mine": false,
          "text": "ktos mi zarysowal drzwi na parkingu"
        },
        {
          "mine": true,
          "text": "znam jednego, robi solidnie"
        },
        {
          "mine": false,
          "text": "podeslij, dzieki"
        }
      ]
    },
    {
      "name": "Lidia",
      "messages": [
        {
          "mine": true,
          "text": "wpadniesz na herbate po poludniu?"
        },
        {
          "mine": false,
          "text": "chetnie, kolo 16?"
        },
        {
          "mine": true,
          "text": "moze byc, upiekę ciasteczka"
        },
        {
          "mine": false,
          "text": "uwielbiam twoje ciasteczka"
        },
        {
          "mine": true,
          "text": "to czekam, do zobaczenia"
        }
      ]
    },
    {
      "name": "Mariusz",
      "messages": [
        {
          "mine": false,
          "text": "podwiezc cie jutro na lotnisko?"
        },
        {
          "mine": true,
          "text": "o ktorej masz samolot?"
        },
        {
          "mine": false,
          "text": "rano, wyjazd 5 z domu"
        },
        {
          "mine": true,
          "text": "wczesnie ale dam rade, bede"
        },
        {
          "mine": false,
          "text": "jestes wielki, dziekuje"
        }
      ]
    },
    {
      "name": "Ewelina",
      "messages": [
        {
          "mine": true,
          "text": "co robimy na urodziny mamy?"
        },
        {
          "mine": false,
          "text": "moze wspolny obiad w restauracji?"
        },
        {
          "mine": true,
          "text": "dobry pomysl, rezerwuje stolik"
        },
        {
          "mine": false,
          "text": "ja zajme sie tortem"
        },
        {
          "mine": true,
          "text": "super, na ilu ludzi?"
        },
        {
          "mine": false,
          "text": "chyba nas osmioro"
        }
      ]
    },
    {
      "name": "Antoni",
      "messages": [
        {
          "mine": false,
          "text": "masz moze taczke na pozyczke?"
        },
        {
          "mine": true,
          "text": "mam, do czego?"
        },
        {
          "mine": false,
          "text": "przewozie ziemie do ogrodka"
        },
        {
          "mine": true,
          "text": "przyjedz po nia dzis"
        },
        {
          "mine": false,
          "text": "dzieki, wpadne po obiedzie"
        }
      ]
    },
    {
      "name": "Wanda",
      "messages": [
        {
          "mine": true,
          "text": "ciociu jak sie czujesz po grypie?"
        },
        {
          "mine": false,
          "text": "duzo lepiej, dziekuje ze pytasz"
        },
        {
          "mine": true,
          "text": "potrzebujesz czegos ze sklepu?"
        },
        {
          "mine": false,
          "text": "moze cytryny i miod"
        },
        {
          "mine": true,
          "text": "przywioze po pracy"
        }
      ]
    },
    {
      "name": "Fabian",
      "messages": [
        {
          "mine": false,
          "text": "zmieniamy godzine zebrania na 15"
        },
        {
          "mine": true,
          "text": "ok, zdaze wrocic z lunchu"
        },
        {
          "mine": false,
          "text": "przynies notatki z zeszlego razu"
        },
        {
          "mine": true,
          "text": "mam je, wydrukuje"
        },
        {
          "mine": false,
          "text": "super, dzieki"
        }
      ]
    },
    {
      "name": "Malgosia",
      "messages": [
        {
          "mine": true,
          "text": "jedziesz na wywczas w wakacje?"
        },
        {
          "mine": false,
          "text": "tak, nad morze na tydzien"
        },
        {
          "mine": true,
          "text": "ale super, gdzie dokladnie?"
        },
        {
          "mine": false,
          "text": "nad baltykiem, maly domek"
        },
        {
          "mine": true,
          "text": "zazdroszcze, milego wypoczynku"
        }
      ]
    },
    {
      "name": "Gabriel",
      "messages": [
        {
          "mine": false,
          "text": "masz czas w niedziele na ryby?"
        },
        {
          "mine": true,
          "text": "gdzie sie wybierasz?"
        },
        {
          "mine": false,
          "text": "nad staw za miastem"
        },
        {
          "mine": true,
          "text": "moge, wezme swoj wedke"
        },
        {
          "mine": false,
          "text": "spoko, ja robie kanapki"
        }
      ]
    },
    {
      "name": "Teresa",
      "messages": [
        {
          "mine": true,
          "text": "babciu przyjade z dziecmi w niedziele"
        },
        {
          "mine": false,
          "text": "cudownie, ugotuje pierogi"
        },
        {
          "mine": true,
          "text": "one uwielbiaja twoje pierogi"
        },
        {
          "mine": false,
          "text": "to zrobie duzo, o ktorej bedziecie?"
        },
        {
          "mine": true,
          "text": "kolo poludnia"
        }
      ]
    },
    {
      "name": "Hubert",
      "messages": [
        {
          "mine": false,
          "text": "wpadniesz obejrzec mecz u mnie?"
        },
        {
          "mine": true,
          "text": "kiedy grają?"
        },
        {
          "mine": false,
          "text": "sobota 20:45"
        },
        {
          "mine": true,
          "text": "bede, przyniose przekaski"
        },
        {
          "mine": false,
          "text": "super, ja stawiam napoje"
        }
      ]
    },
    {
      "name": "Celina",
      "messages": [
        {
          "mine": true,
          "text": "masz jakis pomysl na obiad?"
        },
        {
          "mine": false,
          "text": "zrob nalesniki, szybkie i smaczne"
        },
        {
          "mine": true,
          "text": "o dobra, dzieci ucieszą sie"
        },
        {
          "mine": false,
          "text": "z serem albo dzemem"
        },
        {
          "mine": true,
          "text": "zrobie i tak i tak"
        }
      ]
    },
    {
      "name": "Leszek",
      "messages": [
        {
          "mine": false,
          "text": "masz moze zapasowa zarowke?"
        },
        {
          "mine": true,
          "text": "jaka potrzebujesz?"
        },
        {
          "mine": false,
          "text": "zwykla do lampki nocnej"
        },
        {
          "mine": true,
          "text": "mam kilka, wpadnij"
        },
        {
          "mine": false,
          "text": "dzieki, zaraz przyjde"
        }
      ]
    },
    {
      "name": "Angelika",
      "messages": [
        {
          "mine": true,
          "text": "idziemy jutro do kina?"
        },
        {
          "mine": false,
          "text": "co graja?"
        },
        {
          "mine": true,
          "text": "ta nowa komedia romantyczna"
        },
        {
          "mine": false,
          "text": "chetnie, seans wieczorny?"
        },
        {
          "mine": true,
          "text": "tak, kupie bilety online"
        },
        {
          "mine": false,
          "text": "super, ja stawiam popcorn"
        }
      ]
    },
    {
      "name": "Stefan",
      "messages": [
        {
          "mine": false,
          "text": "przyjdziesz pomoc naprawic plot?"
        },
        {
          "mine": true,
          "text": "co sie stalo?"
        },
        {
          "mine": false,
          "text": "wiatr wywalil jedno przeslo"
        },
        {
          "mine": true,
          "text": "wpadne w sobote z narzedziami"
        },
        {
          "mine": false,
          "text": "dzieki sasiedzie, odwdziecze sie"
        }
      ]
    },
    {
      "name": "Bozena",
      "messages": [
        {
          "mine": true,
          "text": "kupilas juz prezenty swiateczne?"
        },
        {
          "mine": false,
          "text": "polowe, reszte w ten weekend"
        },
        {
          "mine": true,
          "text": "ja jeszcze nic, panika haha"
        },
        {
          "mine": false,
          "text": "chodzmy razem, latwiej wybierac"
        },
        {
          "mine": true,
          "text": "super, sobota rano?"
        }
      ]
    }
  ],
  "ru": [
    {
      "name": "Мама",
      "messages": [
        {
          "mine": false,
          "text": "ты картошку купил?"
        },
        {
          "mine": true,
          "text": "ой блин забыл, сейчас заскочу в магаз"
        },
        {
          "mine": false,
          "text": "возьми ещё хлеб и молоко"
        },
        {
          "mine": true,
          "text": "хорошо, чёрный или белый?"
        },
        {
          "mine": false,
          "text": "оба возьми, папа опять весь съел"
        },
        {
          "mine": true,
          "text": "ага, буду через полчаса"
        }
      ]
    },
    {
      "name": "Папа",
      "messages": [
        {
          "mine": true,
          "text": "пап, машина опять не заводится"
        },
        {
          "mine": false,
          "text": "аккумулятор наверное сел. давай прикурим вечером"
        },
        {
          "mine": true,
          "text": "у тебя провода есть?"
        },
        {
          "mine": false,
          "text": "есть в гараже, приеду в семь"
        },
        {
          "mine": true,
          "text": "спасибо, буду ждать"
        }
      ]
    },
    {
      "name": "Бабушка",
      "messages": [
        {
          "mine": false,
          "text": "внучок ты когда приедешь? я пирогов напекла"
        },
        {
          "mine": true,
          "text": "баб в субботу приеду, с капустой напекла?"
        },
        {
          "mine": false,
          "text": "и с капустой и с яблоками, как ты любишь"
        },
        {
          "mine": true,
          "text": "ммм жду не дождусь, чаю попьём"
        },
        {
          "mine": false,
          "text": "приезжай не голодный, я борщ ещё сварю"
        }
      ]
    },
    {
      "name": "Оля",
      "messages": [
        {
          "mine": true,
          "text": "ты завтра во сколько на работу?"
        },
        {
          "mine": false,
          "text": "к девяти, а что?"
        },
        {
          "mine": true,
          "text": "может вместе доедем, подкинешь?"
        },
        {
          "mine": false,
          "text": "конечно, выходи к 8:30 к подъезду"
        },
        {
          "mine": true,
          "text": "супер, спасибо!"
        },
        {
          "mine": false,
          "text": "только не опаздывай как в прошлый раз))"
        }
      ]
    },
    {
      "name": "Катя",
      "messages": [
        {
          "mine": false,
          "text": "привет! идём в кино в пятницу?"
        },
        {
          "mine": true,
          "text": "давай, что смотреть будем?"
        },
        {
          "mine": false,
          "text": "там новая комедия вышла, говорят смешная"
        },
        {
          "mine": true,
          "text": "ок, билеты возьмёшь онлайн?"
        },
        {
          "mine": false,
          "text": "да, на 19:00 нормально?"
        },
        {
          "mine": true,
          "text": "отлично, встретимся у входа"
        }
      ]
    },
    {
      "name": "Дима",
      "messages": [
        {
          "mine": true,
          "text": "верни дрель когда сможешь, ремонт надо доделать"
        },
        {
          "mine": false,
          "text": "ой да, совсем забыл. завтра занесу"
        },
        {
          "mine": true,
          "text": "давай, я дома весь вечер"
        },
        {
          "mine": false,
          "text": "хорошо, часов в восемь норм?"
        },
        {
          "mine": true,
          "text": "норм, заодно чаю попьём"
        }
      ]
    },
    {
      "name": "Серёжа",
      "messages": [
        {
          "mine": false,
          "text": "го в субботу на рыбалку?"
        },
        {
          "mine": true,
          "text": "погоду смотрел? вроде дождь обещают"
        },
        {
          "mine": false,
          "text": "да не, к утру распогодится"
        },
        {
          "mine": true,
          "text": "ладно уговорил, во сколько выезжаем?"
        },
        {
          "mine": false,
          "text": "в пять утра, чтоб место занять"
        },
        {
          "mine": true,
          "text": "рано конечно, ну ладно, червей возьмёшь?"
        },
        {
          "mine": false,
          "text": "возьму, ты термос захвати"
        }
      ]
    },
    {
      "name": "Настя",
      "messages": [
        {
          "mine": true,
          "text": "у тебя рецепт того салата сохранился?"
        },
        {
          "mine": false,
          "text": "какого, с крабовыми палочками?"
        },
        {
          "mine": true,
          "text": "да, гости придут хочу сделать"
        },
        {
          "mine": false,
          "text": "сейчас скину, там ещё кукуруза и яйца"
        },
        {
          "mine": true,
          "text": "спасибо выручила!"
        }
      ]
    },
    {
      "name": "Лена",
      "messages": [
        {
          "mine": false,
          "text": "ты не забыла что у Ани день рождения в четверг?"
        },
        {
          "mine": true,
          "text": "ой точно! что дарить будем?"
        },
        {
          "mine": false,
          "text": "давай скинемся на сертификат в магазин косметики"
        },
        {
          "mine": true,
          "text": "хорошая идея, сколько с меня?"
        },
        {
          "mine": false,
          "text": "по полторы тысячи выйдет"
        },
        {
          "mine": true,
          "text": "ок, завтра отдам на работе"
        }
      ]
    },
    {
      "name": "Ира",
      "messages": [
        {
          "mine": true,
          "text": "во сколько завтра планёрка?"
        },
        {
          "mine": false,
          "text": "в десять перенесли, шеф написал"
        },
        {
          "mine": true,
          "text": "а я думала в девять, спасибо что сказала"
        },
        {
          "mine": false,
          "text": "ага, отчёт не забудь принести"
        },
        {
          "mine": true,
          "text": "уже распечатала, всё готово"
        }
      ]
    },
    {
      "name": "Марина",
      "messages": [
        {
          "mine": false,
          "text": "привет, ты сегодня в зал идёшь?"
        },
        {
          "mine": true,
          "text": "да, к семи вечера собиралась"
        },
        {
          "mine": false,
          "text": "давай вместе, я как раз хотела"
        },
        {
          "mine": true,
          "text": "супер, встретимся у входа в фитнес"
        },
        {
          "mine": false,
          "text": "ок, форму не забудь))"
        }
      ]
    },
    {
      "name": "Таня",
      "messages": [
        {
          "mine": true,
          "text": "ты не знаешь где хороший стоматолог?"
        },
        {
          "mine": false,
          "text": "я к одному хожу на соседней улице, довольна"
        },
        {
          "mine": true,
          "text": "скинь контакт, зуб ноет второй день"
        },
        {
          "mine": false,
          "text": "сейчас найду в телефоне, минутку"
        },
        {
          "mine": true,
          "text": "спасибо, надо срочно записаться"
        }
      ]
    },
    {
      "name": "Вика",
      "messages": [
        {
          "mine": false,
          "text": "ты платье вернула которое брала?"
        },
        {
          "mine": true,
          "text": "ой прости, оно у меня, постирала"
        },
        {
          "mine": false,
          "text": "да ничего, мне на выходных нужно"
        },
        {
          "mine": true,
          "text": "завтра занесу, честно-честно"
        },
        {
          "mine": false,
          "text": "договорились, спасибо"
        }
      ]
    },
    {
      "name": "Женя",
      "messages": [
        {
          "mine": true,
          "text": "го кофе после работы?"
        },
        {
          "mine": false,
          "text": "давай, в ту же кофейню?"
        },
        {
          "mine": true,
          "text": "ага, у них новый десерт появился говорят"
        },
        {
          "mine": false,
          "text": "о, надо попробовать. в 18:30?"
        },
        {
          "mine": true,
          "text": "идеально, до встречи"
        }
      ]
    },
    {
      "name": "Костя",
      "messages": [
        {
          "mine": false,
          "text": "поможешь диван перетащить в выходные?"
        },
        {
          "mine": true,
          "text": "конечно, куда двигать будем?"
        },
        {
          "mine": false,
          "text": "в другую комнату, надоел на старом месте"
        },
        {
          "mine": true,
          "text": "тяжёлый? может ещё кого позвать"
        },
        {
          "mine": false,
          "text": "вдвоём справимся, он не сильно большой"
        },
        {
          "mine": true,
          "text": "ок, приду в субботу утром"
        }
      ]
    },
    {
      "name": "Артём",
      "messages": [
        {
          "mine": true,
          "text": "ты домашку по математике сделал?"
        },
        {
          "mine": false,
          "text": "почти, застрял на последней задаче"
        },
        {
          "mine": true,
          "text": "скинь фото, вместе разберём"
        },
        {
          "mine": false,
          "text": "сейчас сфоткаю, там про проценты"
        },
        {
          "mine": true,
          "text": "а, это лёгкое, объясню"
        }
      ]
    },
    {
      "name": "Максим",
      "messages": [
        {
          "mine": false,
          "text": "мяч возьмёшь на футбол в воскресенье?"
        },
        {
          "mine": true,
          "text": "возьму, во сколько собираемся?"
        },
        {
          "mine": false,
          "text": "в 11 на нашем поле"
        },
        {
          "mine": true,
          "text": "сколько человек будет?"
        },
        {
          "mine": false,
          "text": "уже восемь набралось, на две команды хватит"
        },
        {
          "mine": true,
          "text": "класс, буду вовремя"
        }
      ]
    },
    {
      "name": "Наташа",
      "messages": [
        {
          "mine": true,
          "text": "не подскажешь как борщ варить без свеклы получается бледный"
        },
        {
          "mine": false,
          "text": "надо свеклу отдельно потушить с уксусом, тогда цвет держится"
        },
        {
          "mine": true,
          "text": "а томатную пасту добавлять?"
        },
        {
          "mine": false,
          "text": "обязательно, ложку и лимонного сока капни"
        },
        {
          "mine": true,
          "text": "поняла, попробую сегодня"
        }
      ]
    },
    {
      "name": "Юля",
      "messages": [
        {
          "mine": false,
          "text": "ты завтра детей в садик ведёшь?"
        },
        {
          "mine": true,
          "text": "да, а могу и твоего захватить"
        },
        {
          "mine": false,
          "text": "ой была бы благодарна, мне рано на работу"
        },
        {
          "mine": true,
          "text": "без проблем, к восьми подходите"
        },
        {
          "mine": false,
          "text": "спасибо огромное, ты меня спасаешь"
        }
      ]
    },
    {
      "name": "Света",
      "messages": [
        {
          "mine": true,
          "text": "погода портится, зонт брать завтра?"
        },
        {
          "mine": false,
          "text": "бери, обещают дождь весь день"
        },
        {
          "mine": true,
          "text": "эх, а я в кроссовках хотела"
        },
        {
          "mine": false,
          "text": "лучше ботинки, лужи будут везде"
        },
        {
          "mine": true,
          "text": "ладно, послушаю тебя"
        }
      ]
    },
    {
      "name": "Паша",
      "messages": [
        {
          "mine": false,
          "text": "одолжишь тысячу до зарплаты? отдам в пятницу"
        },
        {
          "mine": true,
          "text": "да без вопросов, скину сейчас"
        },
        {
          "mine": false,
          "text": "спасибо друг, выручил"
        },
        {
          "mine": true,
          "text": "не парься, бывает"
        },
        {
          "mine": false,
          "text": "в пятницу верну сразу как получу"
        }
      ]
    },
    {
      "name": "Рома",
      "messages": [
        {
          "mine": true,
          "text": "ты в отпуск когда собираешься?"
        },
        {
          "mine": false,
          "text": "в августе планирую, на море хочу"
        },
        {
          "mine": true,
          "text": "куда именно?"
        },
        {
          "mine": false,
          "text": "думаю в Сочи, там нормально в это время"
        },
        {
          "mine": true,
          "text": "завидую, у меня только в октябре"
        },
        {
          "mine": false,
          "text": "ну в октябре тоже неплохо, дешевле"
        }
      ]
    },
    {
      "name": "Андрей",
      "messages": [
        {
          "mine": false,
          "text": "во сколько завтра смена?"
        },
        {
          "mine": true,
          "text": "с двенадцати до восьми"
        },
        {
          "mine": false,
          "text": "а меня на утро поставили, поменяемся?"
        },
        {
          "mine": true,
          "text": "могу, мне как раз вечер удобнее"
        },
        {
          "mine": false,
          "text": "отлично, напишу начальнику"
        }
      ]
    },
    {
      "name": "Саша",
      "messages": [
        {
          "mine": true,
          "text": "ты собаку выгулял?"
        },
        {
          "mine": false,
          "text": "да, только пришли, весь мокрый пёс на улице лужи"
        },
        {
          "mine": true,
          "text": "лапы протри полотенцем"
        },
        {
          "mine": false,
          "text": "уже протёр, лежит довольный"
        },
        {
          "mine": true,
          "text": "молодец, покорми его в семь"
        }
      ]
    },
    {
      "name": "Оксана",
      "messages": [
        {
          "mine": false,
          "text": "ты записалась к парикмахеру?"
        },
        {
          "mine": true,
          "text": "да на субботу, хочу подстричься наконец"
        },
        {
          "mine": false,
          "text": "а во сколько? я тоже хочу"
        },
        {
          "mine": true,
          "text": "у меня в двенадцать, спроси есть ли после"
        },
        {
          "mine": false,
          "text": "хорошо позвоню, вместе сходим"
        }
      ]
    },
    {
      "name": "Галя",
      "messages": [
        {
          "mine": true,
          "text": "у вас яблоки в этом году уродились?"
        },
        {
          "mine": false,
          "text": "ой полно, не знаю куда девать"
        },
        {
          "mine": true,
          "text": "привези пару килограмм, компот сварю"
        },
        {
          "mine": false,
          "text": "конечно, в выходные заеду с дачи"
        },
        {
          "mine": true,
          "text": "спасибо, а я тебе огурцов дам"
        }
      ]
    },
    {
      "name": "Люда",
      "messages": [
        {
          "mine": false,
          "text": "ты не видела мои очки? вчера у тебя была"
        },
        {
          "mine": true,
          "text": "сейчас гляну... да, на кухне лежат"
        },
        {
          "mine": false,
          "text": "фух, а я обыскалась"
        },
        {
          "mine": true,
          "text": "занесу завтра, или сама забежишь?"
        },
        {
          "mine": false,
          "text": "давай сама зайду, всё равно мимо иду"
        }
      ]
    },
    {
      "name": "Нина",
      "messages": [
        {
          "mine": true,
          "text": "во сколько поезд у тёти завтра?"
        },
        {
          "mine": false,
          "text": "прибывает в 14:20, надо встретить"
        },
        {
          "mine": true,
          "text": "я на машине могу, заберу с вокзала"
        },
        {
          "mine": false,
          "text": "было бы здорово, у неё чемоданы тяжёлые"
        },
        {
          "mine": true,
          "text": "ок, буду за десять минут до"
        }
      ]
    },
    {
      "name": "Витя",
      "messages": [
        {
          "mine": false,
          "text": "телек не показывает, ты что делал с настройками?"
        },
        {
          "mine": true,
          "text": "ничего не трогал, попробуй перезагрузить"
        },
        {
          "mine": false,
          "text": "как это сделать?"
        },
        {
          "mine": true,
          "text": "выдерни из розетки на минуту и обратно"
        },
        {
          "mine": false,
          "text": "о заработало! спасибо"
        }
      ]
    },
    {
      "name": "Гена",
      "messages": [
        {
          "mine": true,
          "text": "ты завтра в гараж пойдёшь?"
        },
        {
          "mine": false,
          "text": "собирался, масло хочу поменять"
        },
        {
          "mine": true,
          "text": "можно с тобой? колесо подкачать надо"
        },
        {
          "mine": false,
          "text": "приходи, насос есть у меня"
        },
        {
          "mine": true,
          "text": "спасибо, часов в одиннадцать?"
        },
        {
          "mine": false,
          "text": "давай, буду там"
        }
      ]
    },
    {
      "name": "Тоня",
      "messages": [
        {
          "mine": false,
          "text": "ты рассаду высадила уже?"
        },
        {
          "mine": true,
          "text": "помидоры да, а перец ещё рано"
        },
        {
          "mine": false,
          "text": "а я всё вместе, боюсь заморозков"
        },
        {
          "mine": true,
          "text": "укрой плёнкой на всякий случай"
        },
        {
          "mine": false,
          "text": "так и сделаю, спасибо за совет"
        }
      ]
    },
    {
      "name": "Валя",
      "messages": [
        {
          "mine": true,
          "text": "суп какой сегодня будешь? куриный или грибной"
        },
        {
          "mine": false,
          "text": "давай куриный, с лапшой"
        },
        {
          "mine": true,
          "text": "хорошо, через час готов будет"
        },
        {
          "mine": false,
          "text": "я как раз с работы приду"
        },
        {
          "mine": true,
          "text": "супер, накрою на стол"
        }
      ]
    },
    {
      "name": "Сантехник Игорь",
      "messages": [
        {
          "mine": true,
          "text": "здравствуйте, у меня кран на кухне капает, посмотрите?"
        },
        {
          "mine": false,
          "text": "здравствуйте, могу завтра после обеда подъехать"
        },
        {
          "mine": true,
          "text": "во сколько удобно?"
        },
        {
          "mine": false,
          "text": "часа в три, прокладку заодно возьму"
        },
        {
          "mine": true,
          "text": "отлично, буду дома, спасибо"
        }
      ]
    },
    {
      "name": "Парикмахер Аня",
      "messages": [
        {
          "mine": false,
          "text": "добрый день! напоминаю о записи завтра в 12"
        },
        {
          "mine": true,
          "text": "да, помню, приду вовремя"
        },
        {
          "mine": false,
          "text": "будем как обычно или что-то новое?"
        },
        {
          "mine": true,
          "text": "давайте покороче в этот раз"
        },
        {
          "mine": false,
          "text": "хорошо, всё сделаем, до встречи"
        }
      ]
    },
    {
      "name": "Ветеринар",
      "messages": [
        {
          "mine": true,
          "text": "здравствуйте, коту нужна прививка, когда можно?"
        },
        {
          "mine": false,
          "text": "здравствуйте, в четверг есть окно в 16:00"
        },
        {
          "mine": true,
          "text": "подходит, что взять с собой?"
        },
        {
          "mine": false,
          "text": "паспорт питомца и переноску"
        },
        {
          "mine": true,
          "text": "поняла, спасибо, будем"
        }
      ]
    },
    {
      "name": "Няня Даша",
      "messages": [
        {
          "mine": false,
          "text": "здравствуйте, я на пять минут задержусь, пробки"
        },
        {
          "mine": true,
          "text": "ничего страшного, мы дома"
        },
        {
          "mine": false,
          "text": "Мишу покормили уже?"
        },
        {
          "mine": true,
          "text": "да, поел кашу, играет сейчас"
        },
        {
          "mine": false,
          "text": "отлично, скоро буду"
        }
      ]
    },
    {
      "name": "Автосервис Женя",
      "messages": [
        {
          "mine": true,
          "text": "здравствуйте, машина готова?"
        },
        {
          "mine": false,
          "text": "да, колодки поменяли, можете забирать"
        },
        {
          "mine": true,
          "text": "во сколько работаете до?"
        },
        {
          "mine": false,
          "text": "до восьми вечера"
        },
        {
          "mine": true,
          "text": "заеду после работы, спасибо"
        }
      ]
    },
    {
      "name": "Курьер",
      "messages": [
        {
          "mine": false,
          "text": "добрый день, ваш заказ у подъезда через 10 минут"
        },
        {
          "mine": true,
          "text": "спасибо, я дома, поднимайтесь"
        },
        {
          "mine": false,
          "text": "какой этаж?"
        },
        {
          "mine": true,
          "text": "четвёртый, квартира справа"
        },
        {
          "mine": false,
          "text": "понял, иду"
        }
      ]
    },
    {
      "name": "Репетитор Марина",
      "messages": [
        {
          "mine": true,
          "text": "здравствуйте, занятие завтра в силе?"
        },
        {
          "mine": false,
          "text": "да, в пять, как договаривались"
        },
        {
          "mine": true,
          "text": "сын подготовил упражнения"
        },
        {
          "mine": false,
          "text": "хорошо, проверим и разберём новую тему"
        },
        {
          "mine": true,
          "text": "спасибо, до завтра"
        }
      ]
    },
    {
      "name": "Сосед Николай",
      "messages": [
        {
          "mine": false,
          "text": "у вас вода горячая есть? у нас отключили"
        },
        {
          "mine": true,
          "text": "тоже нет, наверное по всему дому"
        },
        {
          "mine": false,
          "text": "эх, обещали до вечера включить"
        },
        {
          "mine": true,
          "text": "потерпим, не впервой"
        },
        {
          "mine": false,
          "text": "ага, спасибо, хорошего дня"
        }
      ]
    },
    {
      "name": "Стоматолог",
      "messages": [
        {
          "mine": false,
          "text": "добрый день, подтвердите запись на пятницу 10:00"
        },
        {
          "mine": true,
          "text": "да, подтверждаю, приду"
        },
        {
          "mine": false,
          "text": "хорошо, приходите за 10 минут"
        },
        {
          "mine": true,
          "text": "конечно, спасибо за напоминание"
        }
      ]
    },
    {
      "name": "Кристина",
      "messages": [
        {
          "mine": true,
          "text": "ты торт заказала на день рождения?"
        },
        {
          "mine": false,
          "text": "да, шоколадный, заберём в субботу"
        },
        {
          "mine": true,
          "text": "во сколько гости придут?"
        },
        {
          "mine": false,
          "text": "к шести, успеем всё накрыть"
        },
        {
          "mine": true,
          "text": "я салаты возьму на себя"
        },
        {
          "mine": false,
          "text": "отлично, тогда я горячее"
        }
      ]
    },
    {
      "name": "Егор",
      "messages": [
        {
          "mine": false,
          "text": "перекинь пожалуйста презентацию, потерял файл"
        },
        {
          "mine": true,
          "text": "сейчас, ту что для понедельника?"
        },
        {
          "mine": false,
          "text": "да, спасибо огромное"
        },
        {
          "mine": true,
          "text": "отправил на почту, проверь"
        },
        {
          "mine": false,
          "text": "получил, ты спаситель"
        }
      ]
    },
    {
      "name": "Алина",
      "messages": [
        {
          "mine": true,
          "text": "ты сегодня в магазин пойдёшь?"
        },
        {
          "mine": false,
          "text": "да, что-то нужно?"
        },
        {
          "mine": true,
          "text": "возьми стиральный порошок, у нас кончился"
        },
        {
          "mine": false,
          "text": "ок, какой обычно берём?"
        },
        {
          "mine": true,
          "text": "который в синей упаковке"
        },
        {
          "mine": false,
          "text": "поняла, куплю"
        }
      ]
    },
    {
      "name": "Денис",
      "messages": [
        {
          "mine": false,
          "text": "го завтра в баню?"
        },
        {
          "mine": true,
          "text": "давно не были, я за"
        },
        {
          "mine": false,
          "text": "веники есть или купить?"
        },
        {
          "mine": true,
          "text": "купи парочку, мои засохли"
        },
        {
          "mine": false,
          "text": "ок, в шесть встречаемся?"
        },
        {
          "mine": true,
          "text": "нормально, чай возьму с травами"
        }
      ]
    },
    {
      "name": "Полина",
      "messages": [
        {
          "mine": true,
          "text": "ты книгу дочитала которую брала?"
        },
        {
          "mine": false,
          "text": "почти, осталась пара глав"
        },
        {
          "mine": true,
          "text": "не торопись, мне пока не нужна"
        },
        {
          "mine": false,
          "text": "спасибо, очень затягивает"
        },
        {
          "mine": true,
          "text": "рада что понравилась"
        }
      ]
    },
    {
      "name": "Кирилл",
      "messages": [
        {
          "mine": false,
          "text": "подвезёшь завтра до центра?"
        },
        {
          "mine": true,
          "text": "могу, мне как раз туда"
        },
        {
          "mine": false,
          "text": "во сколько выезжаешь?"
        },
        {
          "mine": true,
          "text": "в половину девятого"
        },
        {
          "mine": false,
          "text": "успею, спасибо, буду ждать у дома"
        }
      ]
    },
    {
      "name": "Тётя Люба",
      "messages": [
        {
          "mine": false,
          "text": "как ваши дела, давно не звонили"
        },
        {
          "mine": true,
          "text": "всё хорошо теть Люб, закрутились с работой"
        },
        {
          "mine": false,
          "text": "приезжайте в гости на выходных"
        },
        {
          "mine": true,
          "text": "постараемся, соскучились по вашим пирожкам"
        },
        {
          "mine": false,
          "text": "напеку побольше, жду"
        }
      ]
    },
    {
      "name": "Дядя Вова",
      "messages": [
        {
          "mine": true,
          "text": "дядь Вов, ты в деревню на выходные?"
        },
        {
          "mine": false,
          "text": "да, картошку копать пора"
        },
        {
          "mine": true,
          "text": "помочь приехать?"
        },
        {
          "mine": false,
          "text": "было бы кстати, руки лишними не бывают"
        },
        {
          "mine": true,
          "text": "тогда в субботу утром буду"
        },
        {
          "mine": false,
          "text": "давай, баньку затопим потом"
        }
      ]
    },
    {
      "name": "Маша",
      "messages": [
        {
          "mine": false,
          "text": "ты не помнишь во сколько родительское собрание?"
        },
        {
          "mine": true,
          "text": "в четверг в 18:30"
        },
        {
          "mine": false,
          "text": "точно, спасибо, чуть не забыла"
        },
        {
          "mine": true,
          "text": "пойдём вместе? я тоже иду"
        },
        {
          "mine": false,
          "text": "давай, встретимся у школы"
        }
      ]
    },
    {
      "name": "Антон",
      "messages": [
        {
          "mine": true,
          "text": "ты билеты на поезд взял?"
        },
        {
          "mine": false,
          "text": "да, купе на двоих, нижние полки"
        },
        {
          "mine": true,
          "text": "отлично, во сколько отправление?"
        },
        {
          "mine": false,
          "text": "в 22:40, надо не опоздать"
        },
        {
          "mine": true,
          "text": "приеду заранее на вокзал"
        }
      ]
    },
    {
      "name": "Даша",
      "messages": [
        {
          "mine": false,
          "text": "у тебя есть зарядка для телефона? моя сломалась"
        },
        {
          "mine": true,
          "text": "есть, могу дать на время"
        },
        {
          "mine": false,
          "text": "спасибо, заберу сегодня"
        },
        {
          "mine": true,
          "text": "давай, я до восьми дома"
        },
        {
          "mine": false,
          "text": "забегу после семи"
        }
      ]
    },
    {
      "name": "Игорь",
      "messages": [
        {
          "mine": true,
          "text": "ты газон косил уже?"
        },
        {
          "mine": false,
          "text": "нет ещё, косилка барахлит"
        },
        {
          "mine": true,
          "text": "могу свою одолжить"
        },
        {
          "mine": false,
          "text": "выручишь, а то трава по колено"
        },
        {
          "mine": true,
          "text": "заходи вечером заберёшь"
        },
        {
          "mine": false,
          "text": "спасибо, зайду"
        }
      ]
    },
    {
      "name": "Лиза",
      "messages": [
        {
          "mine": false,
          "text": "во сколько встречаемся в кафе?"
        },
        {
          "mine": true,
          "text": "давай в час дня"
        },
        {
          "mine": false,
          "text": "то которое у парка?"
        },
        {
          "mine": true,
          "text": "да, там уютно и кофе вкусный"
        },
        {
          "mine": false,
          "text": "договорились, буду"
        }
      ]
    },
    {
      "name": "Толя",
      "messages": [
        {
          "mine": true,
          "text": "ты завтра работаешь?"
        },
        {
          "mine": false,
          "text": "да, до пяти"
        },
        {
          "mine": true,
          "text": "может после встретимся, давно не виделись"
        },
        {
          "mine": false,
          "text": "давай, пивка попьём, погода хорошая"
        },
        {
          "mine": true,
          "text": "отлично, наберу как освобожусь"
        }
      ]
    },
    {
      "name": "Соня",
      "messages": [
        {
          "mine": false,
          "text": "мам, я забыла ключи, ты дома?"
        },
        {
          "mine": true,
          "text": "нет, буду через час"
        },
        {
          "mine": false,
          "text": "ой, подожду у соседки тогда"
        },
        {
          "mine": true,
          "text": "хорошо, скоро приеду, не переживай"
        },
        {
          "mine": false,
          "text": "ладно, жду"
        }
      ]
    },
    {
      "name": "Виталик",
      "messages": [
        {
          "mine": true,
          "text": "поможешь с переездом в субботу?"
        },
        {
          "mine": false,
          "text": "смотря во сколько"
        },
        {
          "mine": true,
          "text": "с утра, часов с десяти"
        },
        {
          "mine": false,
          "text": "ок, приду, машину пригнать?"
        },
        {
          "mine": true,
          "text": "было бы супер, коробок много"
        },
        {
          "mine": false,
          "text": "тогда возьму фургон у брата"
        }
      ]
    },
    {
      "name": "Ксюша",
      "messages": [
        {
          "mine": false,
          "text": "ты маникюр где делаешь? хочу к тебе"
        },
        {
          "mine": true,
          "text": "есть хороший мастер недалеко, скину контакт"
        },
        {
          "mine": false,
          "text": "спасибо, а дорого?"
        },
        {
          "mine": true,
          "text": "нормально, качество отличное"
        },
        {
          "mine": false,
          "text": "запишусь тогда, надоели свои облезлые"
        }
      ]
    },
    {
      "name": "Стас",
      "messages": [
        {
          "mine": true,
          "text": "ты вернул книгу в библиотеку?"
        },
        {
          "mine": false,
          "text": "ой нет, срок вышел уже?"
        },
        {
          "mine": true,
          "text": "вчера был последний день"
        },
        {
          "mine": false,
          "text": "блин, завтра сдам, штраф небольшой"
        },
        {
          "mine": true,
          "text": "ладно, бывает"
        }
      ]
    },
    {
      "name": "Аня",
      "messages": [
        {
          "mine": false,
          "text": "спасибо за подарок, такая красивая кружка!"
        },
        {
          "mine": true,
          "text": "рада что понравилась, с днём рождения ещё раз!"
        },
        {
          "mine": false,
          "text": "было очень весело, жаль что рано ушла"
        },
        {
          "mine": true,
          "text": "в другой раз посидим подольше"
        },
        {
          "mine": false,
          "text": "обязательно, обнимаю"
        }
      ]
    },
    {
      "name": "Григорий",
      "messages": [
        {
          "mine": true,
          "text": "во сколько завтра дантист у ребёнка?"
        },
        {
          "mine": false,
          "text": "в 15:00, я отпросился с работы отвезу"
        },
        {
          "mine": true,
          "text": "хорошо, я тогда заберу из школы"
        },
        {
          "mine": false,
          "text": "договорились, встретимся у поликлиники"
        },
        {
          "mine": true,
          "text": "ага, не опаздывай"
        }
      ]
    },
    {
      "name": "Регина",
      "messages": [
        {
          "mine": false,
          "text": "у тебя есть форма для запекания? одолжишь?"
        },
        {
          "mine": true,
          "text": "есть большая керамическая, подойдёт?"
        },
        {
          "mine": false,
          "text": "идеально, курицу хочу запечь"
        },
        {
          "mine": true,
          "text": "забирай когда удобно"
        },
        {
          "mine": false,
          "text": "зайду вечером, спасибо"
        }
      ]
    },
    {
      "name": "Марат",
      "messages": [
        {
          "mine": true,
          "text": "ты во сколько заканчиваешь тренировку?"
        },
        {
          "mine": false,
          "text": "к девяти, потом свободен"
        },
        {
          "mine": true,
          "text": "заберу тебя, по пути домой"
        },
        {
          "mine": false,
          "text": "спасибо, буду ждать у спортзала"
        },
        {
          "mine": true,
          "text": "ок, напишу как подъеду"
        }
      ]
    },
    {
      "name": "Вера",
      "messages": [
        {
          "mine": false,
          "text": "ты рецепт блинов давала, а пропорции забыла"
        },
        {
          "mine": true,
          "text": "стакан муки, два яйца, пол-литра молока"
        },
        {
          "mine": false,
          "text": "сахар сколько?"
        },
        {
          "mine": true,
          "text": "ложки две и щепотка соли"
        },
        {
          "mine": false,
          "text": "спасибо, буду печь на завтрак"
        }
      ]
    },
    {
      "name": "Тимур",
      "messages": [
        {
          "mine": true,
          "text": "ты забронировал столик на вечер?"
        },
        {
          "mine": false,
          "text": "да, на четверых в 19:00"
        },
        {
          "mine": true,
          "text": "отлично, ребята подтвердили"
        },
        {
          "mine": false,
          "text": "тогда до вечера, не опаздывайте"
        },
        {
          "mine": true,
          "text": "будем вовремя"
        }
      ]
    },
    {
      "name": "Зина",
      "messages": [
        {
          "mine": false,
          "text": "у тебя герань цветёт? у меня никак"
        },
        {
          "mine": true,
          "text": "цветёт, я её подкармливаю раз в неделю"
        },
        {
          "mine": false,
          "text": "чем? может у меня земля плохая"
        },
        {
          "mine": true,
          "text": "обычным удобрением для цветущих, и на солнце ставь"
        },
        {
          "mine": false,
          "text": "попробую, спасибо"
        }
      ]
    },
    {
      "name": "Борис",
      "messages": [
        {
          "mine": true,
          "text": "ты забор докрасил на даче?"
        },
        {
          "mine": false,
          "text": "половину, краска кончилась"
        },
        {
          "mine": true,
          "text": "могу привезти банку в выходные"
        },
        {
          "mine": false,
          "text": "будь добр, тот же зелёный цвет"
        },
        {
          "mine": true,
          "text": "запишу, чтоб не забыть"
        }
      ]
    },
    {
      "name": "Элина",
      "messages": [
        {
          "mine": false,
          "text": "идём завтра на йогу?"
        },
        {
          "mine": true,
          "text": "во сколько занятие?"
        },
        {
          "mine": false,
          "text": "в 10 утра, как раз выходной"
        },
        {
          "mine": true,
          "text": "давай, коврик свой возьму"
        },
        {
          "mine": false,
          "text": "отлично, встретимся у студии"
        }
      ]
    },
    {
      "name": "Федя",
      "messages": [
        {
          "mine": true,
          "text": "ты посылку забрал с почты?"
        },
        {
          "mine": false,
          "text": "нет ещё, очередь была огромная"
        },
        {
          "mine": true,
          "text": "они до скольки работают?"
        },
        {
          "mine": false,
          "text": "до семи, схожу после обеда"
        },
        {
          "mine": true,
          "text": "ок, паспорт не забудь"
        }
      ]
    },
    {
      "name": "Раиса",
      "messages": [
        {
          "mine": false,
          "text": "ты варенье варила из смородины?"
        },
        {
          "mine": true,
          "text": "да, три банки закатала"
        },
        {
          "mine": false,
          "text": "поделишься рецептом? у меня жидкое выходит"
        },
        {
          "mine": true,
          "text": "надо дольше уваривать, кг на кг сахара"
        },
        {
          "mine": false,
          "text": "поняла, в этот раз получится"
        }
      ]
    },
    {
      "name": "Слава",
      "messages": [
        {
          "mine": true,
          "text": "ты картину повесил которую купил?"
        },
        {
          "mine": false,
          "text": "нет, дюбелей нет подходящих"
        },
        {
          "mine": true,
          "text": "у меня есть набор, занесу"
        },
        {
          "mine": false,
          "text": "спасибо, а то стена голая"
        },
        {
          "mine": true,
          "text": "завтра заскочу, заодно посмотрю где повесить"
        }
      ]
    },
    {
      "name": "Милана",
      "messages": [
        {
          "mine": false,
          "text": "ты платье выбрала на свадьбу?"
        },
        {
          "mine": true,
          "text": "ещё нет, никак не могу определиться"
        },
        {
          "mine": false,
          "text": "давай вместе сходим по магазинам"
        },
        {
          "mine": true,
          "text": "давай в выходные, поможешь выбрать"
        },
        {
          "mine": false,
          "text": "конечно, у меня глаз намётан"
        }
      ]
    },
    {
      "name": "Захар",
      "messages": [
        {
          "mine": true,
          "text": "ты доехал нормально?"
        },
        {
          "mine": false,
          "text": "да, только пробки жуткие были"
        },
        {
          "mine": true,
          "text": "отдыхай, завтра созвонимся"
        },
        {
          "mine": false,
          "text": "ага, спокойной ночи"
        },
        {
          "mine": true,
          "text": "тебе тоже, до завтра"
        }
      ]
    },
    {
      "name": "Инна",
      "messages": [
        {
          "mine": false,
          "text": "ты сегодня во сколько заканчиваешь?"
        },
        {
          "mine": true,
          "text": "в шесть, а что?"
        },
        {
          "mine": false,
          "text": "давай в аптеку зайдём, витамины кончились"
        },
        {
          "mine": true,
          "text": "ок, встретимся у метро"
        },
        {
          "mine": false,
          "text": "хорошо, буду ждать"
        }
      ]
    },
    {
      "name": "Матвей",
      "messages": [
        {
          "mine": true,
          "text": "ты ноутбук починил?"
        },
        {
          "mine": false,
          "text": "отнёс в сервис, сказали пыль забилась"
        },
        {
          "mine": true,
          "text": "дорого выйдет?"
        },
        {
          "mine": false,
          "text": "нет, почистят и всё, к среде готов"
        },
        {
          "mine": true,
          "text": "хорошо, а то без него никак"
        }
      ]
    },
    {
      "name": "Яна",
      "messages": [
        {
          "mine": false,
          "text": "у нас молоко есть? хочу кашу сварить утром"
        },
        {
          "mine": true,
          "text": "закончилось, я куплю по дороге домой"
        },
        {
          "mine": false,
          "text": "и хлопья заодно, тоже кончаются"
        },
        {
          "mine": true,
          "text": "хорошо, что-то ещё?"
        },
        {
          "mine": false,
          "text": "нет, спасибо, этого хватит"
        }
      ]
    },
    {
      "name": "Олег",
      "messages": [
        {
          "mine": true,
          "text": "ты завтра свободен помочь с полкой?"
        },
        {
          "mine": false,
          "text": "да, после обеда могу"
        },
        {
          "mine": true,
          "text": "надо просверлить и повесить"
        },
        {
          "mine": false,
          "text": "перфоратор свой возьму"
        },
        {
          "mine": true,
          "text": "отлично, жду"
        }
      ]
    },
    {
      "name": "Диана",
      "messages": [
        {
          "mine": false,
          "text": "ты не знаешь хорошую химчистку? пальто испачкала"
        },
        {
          "mine": true,
          "text": "есть одна в торговом центре, быстро делают"
        },
        {
          "mine": false,
          "text": "спасибо, отнесу завтра"
        },
        {
          "mine": true,
          "text": "там ещё скидка по будням"
        },
        {
          "mine": false,
          "text": "о, вообще супер, пойду в понедельник"
        }
      ]
    },
    {
      "name": "Руслан",
      "messages": [
        {
          "mine": true,
          "text": "во сколько матч сегодня?"
        },
        {
          "mine": false,
          "text": "в девять вечера начало"
        },
        {
          "mine": true,
          "text": "придёшь смотреть?"
        },
        {
          "mine": false,
          "text": "да, чипсов возьму"
        },
        {
          "mine": true,
          "text": "давай, наши должны выиграть"
        },
        {
          "mine": false,
          "text": "надеюсь, в прошлый раз слили"
        }
      ]
    },
    {
      "name": "Алла",
      "messages": [
        {
          "mine": false,
          "text": "ты цветы полила пока меня не было?"
        },
        {
          "mine": true,
          "text": "да, все полила, фиалки распустились"
        },
        {
          "mine": false,
          "text": "спасибо, а то боялась засохнут"
        },
        {
          "mine": true,
          "text": "не переживай, всё в порядке"
        },
        {
          "mine": false,
          "text": "ты золото, скоро приеду"
        }
      ]
    },
    {
      "name": "Вадим",
      "messages": [
        {
          "mine": true,
          "text": "ты шины поменял на летние?"
        },
        {
          "mine": false,
          "text": "нет, всё руки не доходят"
        },
        {
          "mine": false,
          "text": "надо записаться в шиномонтаж"
        },
        {
          "mine": true,
          "text": "давай вместе съездим, у меня тоже"
        },
        {
          "mine": false,
          "text": "отличная идея, в субботу?"
        },
        {
          "mine": true,
          "text": "давай, с утра пораньше пока очередей нет"
        }
      ]
    },
    {
      "name": "Жанна",
      "messages": [
        {
          "mine": false,
          "text": "у тебя есть весы кухонные? тесто мерить"
        },
        {
          "mine": true,
          "text": "есть, заходи забери"
        },
        {
          "mine": false,
          "text": "спасибо, пирог хочу испечь"
        },
        {
          "mine": true,
          "text": "какой?"
        },
        {
          "mine": false,
          "text": "яблочный, по бабушкиному рецепту"
        },
        {
          "mine": true,
          "text": "ммм, кусочек занеси потом"
        }
      ]
    },
    {
      "name": "Никита",
      "messages": [
        {
          "mine": true,
          "text": "ты за хлебом сходишь? я занята"
        },
        {
          "mine": false,
          "text": "схожу, ещё что взять?"
        },
        {
          "mine": true,
          "text": "яйца десяток и масло сливочное"
        },
        {
          "mine": false,
          "text": "понял, сдача останется на мороженое?))"
        },
        {
          "mine": true,
          "text": "ладно, купи себе"
        }
      ]
    },
    {
      "name": "Эля",
      "messages": [
        {
          "mine": false,
          "text": "ты убралась в комнате?"
        },
        {
          "mine": true,
          "text": "почти, пол осталось помыть"
        },
        {
          "mine": false,
          "text": "молодец, гости скоро придут"
        },
        {
          "mine": true,
          "text": "успею, ещё час есть"
        },
        {
          "mine": false,
          "text": "хорошо, я пока ужин готовлю"
        }
      ]
    },
    {
      "name": "Тётя Галя",
      "messages": [
        {
          "mine": false,
          "text": "как дети в школе учатся?"
        },
        {
          "mine": true,
          "text": "хорошо, старший грамоту принёс"
        },
        {
          "mine": false,
          "text": "молодец какой! передавай привет"
        },
        {
          "mine": true,
          "text": "передам, приезжайте на выходных"
        },
        {
          "mine": false,
          "text": "постараюсь, соскучилась"
        }
      ]
    },
    {
      "name": "Костик",
      "messages": [
        {
          "mine": true,
          "text": "ты домой во сколько?"
        },
        {
          "mine": false,
          "text": "часам к восьми, задержусь на работе"
        },
        {
          "mine": true,
          "text": "ужин греть?"
        },
        {
          "mine": false,
          "text": "да, я голодный буду"
        },
        {
          "mine": true,
          "text": "хорошо, котлеты сделала"
        },
        {
          "mine": false,
          "text": "супер, спасибо, люблю тебя"
        }
      ]
    },
    {
      "name": "Роза",
      "messages": [
        {
          "mine": false,
          "text": "ты не забыла собаку от клещей обработать?"
        },
        {
          "mine": true,
          "text": "ой, забыла, куплю капли сегодня"
        },
        {
          "mine": false,
          "text": "сезон начался, надо срочно"
        },
        {
          "mine": true,
          "text": "да, спасибо что напомнила"
        },
        {
          "mine": false,
          "text": "не за что, береги пёсика"
        }
      ]
    },
    {
      "name": "Артур",
      "messages": [
        {
          "mine": true,
          "text": "во сколько завтра выезжаем на дачу?"
        },
        {
          "mine": false,
          "text": "часов в девять, чтоб не в жару"
        },
        {
          "mine": true,
          "text": "что взять из еды?"
        },
        {
          "mine": false,
          "text": "мясо на шашлык уже замариновал"
        },
        {
          "mine": true,
          "text": "тогда я овощи и хлеб"
        },
        {
          "mine": false,
          "text": "отлично, будет здорово"
        }
      ]
    },
    {
      "name": "Людмила",
      "messages": [
        {
          "mine": false,
          "text": "ты записалась на маммографию?"
        },
        {
          "mine": true,
          "text": "да, на следующей неделе"
        },
        {
          "mine": false,
          "text": "молодец, надо следить за здоровьем"
        },
        {
          "mine": true,
          "text": "и ты не забывай, давно проверялась?"
        },
        {
          "mine": false,
          "text": "запишусь тоже, спасибо что напомнила"
        }
      ]
    },
    {
      "name": "Глеб",
      "messages": [
        {
          "mine": true,
          "text": "ты компьютерный стол собрал?"
        },
        {
          "mine": false,
          "text": "собираю, инструкция мутная"
        },
        {
          "mine": true,
          "text": "помочь? я в этом шарю"
        },
        {
          "mine": false,
          "text": "приходи, а то деталей куча"
        },
        {
          "mine": true,
          "text": "буду через полчаса"
        }
      ]
    },
    {
      "name": "Карина",
      "messages": [
        {
          "mine": false,
          "text": "ты кофту связала которую начинала?"
        },
        {
          "mine": true,
          "text": "почти, рукав доделываю"
        },
        {
          "mine": false,
          "text": "покажешь потом? хочу такую же"
        },
        {
          "mine": true,
          "text": "конечно, схему дам"
        },
        {
          "mine": false,
          "text": "спасибо, ты рукодельница"
        }
      ]
    },
    {
      "name": "Пётр",
      "messages": [
        {
          "mine": true,
          "text": "ты снег во дворе почистил?"
        },
        {
          "mine": false,
          "text": "да, всю дорожку разгрёб"
        },
        {
          "mine": true,
          "text": "спасибо, а то скользко было"
        },
        {
          "mine": false,
          "text": "песком ещё посыпал"
        },
        {
          "mine": true,
          "text": "молодец, заходи на чай"
        }
      ]
    },
    {
      "name": "Снежана",
      "messages": [
        {
          "mine": false,
          "text": "во сколько встречаемся у ТЦ?"
        },
        {
          "mine": true,
          "text": "давай в два, пообедаем сначала"
        },
        {
          "mine": false,
          "text": "ок, потом по магазинам"
        },
        {
          "mine": true,
          "text": "мне сапоги нужны на зиму"
        },
        {
          "mine": false,
          "text": "поможем выбрать, там распродажа"
        }
      ]
    },
    {
      "name": "Валера",
      "messages": [
        {
          "mine": true,
          "text": "ты лампочку в коридоре поменял?"
        },
        {
          "mine": false,
          "text": "нет, надо новую купить, перегорела"
        },
        {
          "mine": true,
          "text": "куплю по дороге, какая нужна?"
        },
        {
          "mine": false,
          "text": "обычная, на 60 ватт"
        },
        {
          "mine": true,
          "text": "поняла, возьму пару про запас"
        }
      ]
    },
    {
      "name": "Гуля",
      "messages": [
        {
          "mine": false,
          "text": "ты плов делала? научи, а то у меня рис слипается"
        },
        {
          "mine": true,
          "text": "рис надо промыть и замочить сначала"
        },
        {
          "mine": false,
          "text": "а воды сколько?"
        },
        {
          "mine": true,
          "text": "чтоб на палец покрывала, и не мешать пока варится"
        },
        {
          "mine": false,
          "text": "поняла, попробую в выходные"
        }
      ]
    },
    {
      "name": "Эдик",
      "messages": [
        {
          "mine": true,
          "text": "ты велик починил? колесо спускало"
        },
        {
          "mine": false,
          "text": "да, камеру заклеил, теперь держит"
        },
        {
          "mine": true,
          "text": "го покатаемся в воскресенье?"
        },
        {
          "mine": false,
          "text": "давай, до озера прокатимся"
        },
        {
          "mine": true,
          "text": "класс, погода обещает солнце"
        }
      ]
    },
    {
      "name": "Лариса",
      "messages": [
        {
          "mine": false,
          "text": "ты забрала костюм из ателье?"
        },
        {
          "mine": true,
          "text": "да, подшили идеально"
        },
        {
          "mine": false,
          "text": "сколько взяли?"
        },
        {
          "mine": true,
          "text": "недорого, и быстро сделали"
        },
        {
          "mine": false,
          "text": "надо и мне брюки укоротить отнести"
        }
      ]
    },
    {
      "name": "Богдан",
      "messages": [
        {
          "mine": true,
          "text": "ты забронировал баню на субботу?"
        },
        {
          "mine": false,
          "text": "да, с шести до девяти"
        },
        {
          "mine": true,
          "text": "сколько нас будет?"
        },
        {
          "mine": false,
          "text": "пятеро, скинемся поровну"
        },
        {
          "mine": true,
          "text": "ок, я пиво и рыбу возьму"
        },
        {
          "mine": false,
          "text": "отлично, будет хорошо попариться"
        }
      ]
    },
    {
      "name": "Виолетта",
      "messages": [
        {
          "mine": false,
          "text": "ты не видела мою серёжку? одна потерялась"
        },
        {
          "mine": true,
          "text": "гляну на полу, может закатилась"
        },
        {
          "mine": false,
          "text": "спасибо, любимые были"
        },
        {
          "mine": true,
          "text": "нашла! под диваном лежала"
        },
        {
          "mine": false,
          "text": "ура! спасибо огромное"
        }
      ]
    },
    {
      "name": "Семён",
      "messages": [
        {
          "mine": true,
          "text": "ты кран на даче перекрыл на зиму?"
        },
        {
          "mine": false,
          "text": "да, и воду слил из труб"
        },
        {
          "mine": true,
          "text": "молодец, а то разморозит"
        },
        {
          "mine": false,
          "text": "всё сделал, можно спокойно уезжать"
        },
        {
          "mine": true,
          "text": "отлично, тогда закрываем сезон"
        }
      ]
    }
  ],
  "uk": [
    {
      "name": "Мама",
      "messages": [
        {
          "mine": false,
          "text": "ти вже поїв? не забудь суп розігріти, він в холодильнику"
        },
        {
          "mine": true,
          "text": "поїв, дякую. а хліб закінчився"
        },
        {
          "mine": false,
          "text": "куплю по дорозі з роботи, ще щось треба?"
        },
        {
          "mine": true,
          "text": "візьми молоко і яйця будь ласка"
        },
        {
          "mine": false,
          "text": "добре, буду годині о сьомій"
        },
        {
          "mine": true,
          "text": "ок, чекаю"
        }
      ]
    },
    {
      "name": "Тато",
      "messages": [
        {
          "mine": true,
          "text": "пап, ти машину завтра береш?"
        },
        {
          "mine": false,
          "text": "ні, можеш взяти. тільки бензину долий"
        },
        {
          "mine": true,
          "text": "добре. а де ключі?"
        },
        {
          "mine": false,
          "text": "на полиці біля дверей, де завжди"
        },
        {
          "mine": true,
          "text": "знайшов, дякую"
        }
      ]
    },
    {
      "name": "Бабуся",
      "messages": [
        {
          "mine": false,
          "text": "внучок, коли приїдеш? напекла пиріжків"
        },
        {
          "mine": true,
          "text": "в неділю заскочу, бабусь"
        },
        {
          "mine": false,
          "text": "ой добре, я борщ зварю тоді"
        },
        {
          "mine": true,
          "text": "з квасолею? обожнюю твій борщ"
        },
        {
          "mine": false,
          "text": "звісно з квасолею, як ти любиш"
        },
        {
          "mine": true,
          "text": "все, вже слинки течуть, до неділі"
        }
      ]
    },
    {
      "name": "Дідусь",
      "messages": [
        {
          "mine": false,
          "text": "як там телефон новий, розібрався?"
        },
        {
          "mine": true,
          "text": "майже, ще з фотками треба показати"
        },
        {
          "mine": false,
          "text": "приходь у вихідні, покажеш заодно город глянемо"
        },
        {
          "mine": true,
          "text": "домовились діду"
        }
      ]
    },
    {
      "name": "Оля",
      "messages": [
        {
          "mine": true,
          "text": "оль привіт, кава завтра о 11?"
        },
        {
          "mine": false,
          "text": "давай! у тому місці на розі?"
        },
        {
          "mine": true,
          "text": "ага там. вони круасани смачні роблять"
        },
        {
          "mine": false,
          "text": "чудово, я вже голодна від однієї думки"
        },
        {
          "mine": true,
          "text": "до завтра тоді"
        }
      ]
    },
    {
      "name": "Сестра Іра",
      "messages": [
        {
          "mine": false,
          "text": "можеш забрати малого зі садка? я застрягла"
        },
        {
          "mine": true,
          "text": "можу, о котрій його забирати?"
        },
        {
          "mine": false,
          "text": "до пів шостої треба, дякую тобі величезне"
        },
        {
          "mine": true,
          "text": "все заберу, не переживай"
        },
        {
          "mine": false,
          "text": "ти рятівник, з мене тортик"
        }
      ]
    },
    {
      "name": "Брат Сашко",
      "messages": [
        {
          "mine": true,
          "text": "сашко ти дриль ще маєш мій?"
        },
        {
          "mine": false,
          "text": "маю, забери коли хочеш"
        },
        {
          "mine": true,
          "text": "завтра заскочу після роботи"
        },
        {
          "mine": false,
          "text": "давай, я вдома буду"
        }
      ]
    },
    {
      "name": "Андрій",
      "messages": [
        {
          "mine": false,
          "text": "го в суботу на футбол погнати мʼяч?"
        },
        {
          "mine": true,
          "text": "я за. о котрій і де?"
        },
        {
          "mine": false,
          "text": "об 11 на нашому полі, хлопці підтягнуться"
        },
        {
          "mine": true,
          "text": "клас, бутси захоплю"
        },
        {
          "mine": false,
          "text": "води візьми, спекотно буде"
        }
      ]
    },
    {
      "name": "Наталка",
      "messages": [
        {
          "mine": true,
          "text": "наташ ти рецепт сирника скидала колись, не знайду"
        },
        {
          "mine": false,
          "text": "зараз скину знову, там головне сир сухий"
        },
        {
          "mine": false,
          "text": "і духовку не відкривай перші 40 хв"
        },
        {
          "mine": true,
          "text": "о дякую, спробую сьогодні спекти"
        },
        {
          "mine": false,
          "text": "фоткай як вийде!"
        }
      ]
    },
    {
      "name": "Сантехнік Петро",
      "messages": [
        {
          "mine": true,
          "text": "добрий день, кран на кухні знову капає"
        },
        {
          "mine": false,
          "text": "вітаю, зможу підʼїхати завтра після обіду"
        },
        {
          "mine": true,
          "text": "о котрій орієнтовно?"
        },
        {
          "mine": false,
          "text": "десь між 14 і 15, наберу як виїжджатиму"
        },
        {
          "mine": true,
          "text": "добре, дякую, чекатиму"
        }
      ]
    },
    {
      "name": "Катя з роботи",
      "messages": [
        {
          "mine": false,
          "text": "нараду перенесли на 15:00, всім передай"
        },
        {
          "mine": true,
          "text": "прийнято. а звіт до наради треба?"
        },
        {
          "mine": false,
          "text": "так, хоча б чернетку скинь"
        },
        {
          "mine": true,
          "text": "ок зроблю до обіду"
        },
        {
          "mine": false,
          "text": "супер, дякую"
        }
      ]
    },
    {
      "name": "Вовчик",
      "messages": [
        {
          "mine": true,
          "text": "вов ти на дачу цими вихідними?"
        },
        {
          "mine": false,
          "text": "думаю так, шашлики хочеться"
        },
        {
          "mine": true,
          "text": "маринад я зроблю, мʼясо на тобі"
        },
        {
          "mine": false,
          "text": "по руках, вугілля теж візьму"
        }
      ]
    },
    {
      "name": "Тітка Люда",
      "messages": [
        {
          "mine": false,
          "text": "як мама себе почуває? давно не чула"
        },
        {
          "mine": true,
          "text": "нормально, привіт передавала"
        },
        {
          "mine": false,
          "text": "ой добре, скажи хай береже спину"
        },
        {
          "mine": true,
          "text": "передам обовʼязково"
        }
      ]
    },
    {
      "name": "Дядько Коля",
      "messages": [
        {
          "mine": true,
          "text": "дядь коль, а ви огірки вже посадили?"
        },
        {
          "mine": false,
          "text": "посадив, тільки холодно ще, накрив плівкою"
        },
        {
          "mine": false,
          "text": "приїжджай, розсади помідорів дам"
        },
        {
          "mine": true,
          "text": "о дякую, на вихідних заскочу"
        }
      ]
    },
    {
      "name": "Марічка",
      "messages": [
        {
          "mine": false,
          "text": "ти книжку дочитала що я давала?"
        },
        {
          "mine": true,
          "text": "майже, залишилось глав три"
        },
        {
          "mine": false,
          "text": "не спойлерь мені кінець потім))"
        },
        {
          "mine": true,
          "text": "мовчу, мовчу. дуже затягує"
        },
        {
          "mine": false,
          "text": "оце так, я ж казала!"
        }
      ]
    },
    {
      "name": "Сусідка Галя",
      "messages": [
        {
          "mine": false,
          "text": "не могли б полити квіти поки ми на морі?"
        },
        {
          "mine": true,
          "text": "звісно, ключ занесіть"
        },
        {
          "mine": false,
          "text": "дякую золота, раз на два дні достатньо"
        },
        {
          "mine": true,
          "text": "все зроблю, гарного відпочинку"
        }
      ]
    },
    {
      "name": "Максим",
      "messages": [
        {
          "mine": true,
          "text": "макс го в кіно ввечері?"
        },
        {
          "mine": false,
          "text": "а що йде?"
        },
        {
          "mine": true,
          "text": "та нова комедія, всі хвалять"
        },
        {
          "mine": false,
          "text": "давай на сеанс о 19, квитки бери"
        },
        {
          "mine": true,
          "text": "беру два, зустрінемось біля входу"
        }
      ]
    },
    {
      "name": "Юля",
      "messages": [
        {
          "mine": false,
          "text": "привіт! підкажеш де ти светр той купувала?"
        },
        {
          "mine": true,
          "text": "у тому магазині в центрі, сірий памʼятаєш?"
        },
        {
          "mine": false,
          "text": "ага! ще є розміри думаєш?"
        },
        {
          "mine": true,
          "text": "не знаю, подзвони їм краще"
        },
        {
          "mine": false,
          "text": "гарна ідея, дякую"
        }
      ]
    },
    {
      "name": "Тарас",
      "messages": [
        {
          "mine": true,
          "text": "тарас можеш підкинути завтра до вокзалу?"
        },
        {
          "mine": false,
          "text": "можу, о котрій потяг?"
        },
        {
          "mine": true,
          "text": "о 8:40, треба виїхати заздалегідь"
        },
        {
          "mine": false,
          "text": "буду о 7:50 під домом"
        },
        {
          "mine": true,
          "text": "дуже дякую, виручив"
        }
      ]
    },
    {
      "name": "Оксана",
      "messages": [
        {
          "mine": false,
          "text": "ти на день народження до Іри йдеш?"
        },
        {
          "mine": true,
          "text": "йду, а що дарувати думаєш?"
        },
        {
          "mine": false,
          "text": "може скинемось на сертифікат?"
        },
        {
          "mine": true,
          "text": "гарна ідея, я за"
        },
        {
          "mine": false,
          "text": "тоді я замовлю, а ти передаси половину"
        }
      ]
    },
    {
      "name": "Діма",
      "messages": [
        {
          "mine": true,
          "text": "дім зарядку не бачив мою? думаю в тебе лишив"
        },
        {
          "mine": false,
          "text": "є така, чорна? лежить на столі"
        },
        {
          "mine": true,
          "text": "так вона! завтра заберу"
        },
        {
          "mine": false,
          "text": "ок, покладу в передпокій щоб не забути"
        }
      ]
    },
    {
      "name": "Вчителька Світлана Іванівна",
      "messages": [
        {
          "mine": false,
          "text": "доброго дня, завтра батьківські збори о 18:00"
        },
        {
          "mine": true,
          "text": "добрий день, дякую, буду"
        },
        {
          "mine": false,
          "text": "принесіть, будь ласка, щоденник підписати"
        },
        {
          "mine": true,
          "text": "звісно, не забуду"
        }
      ]
    },
    {
      "name": "Женя",
      "messages": [
        {
          "mine": true,
          "text": "жень ти сьогодні в спортзал?"
        },
        {
          "mine": false,
          "text": "так, о 19 планую"
        },
        {
          "mine": true,
          "text": "давай разом, ноги качаємо"
        },
        {
          "mine": false,
          "text": "ой, тоді я потім ходити не зможу))"
        },
        {
          "mine": true,
          "text": "терпи, зате красивий будеш"
        }
      ]
    },
    {
      "name": "Христина",
      "messages": [
        {
          "mine": false,
          "text": "ти торт замовляла на субботу?"
        },
        {
          "mine": true,
          "text": "ще ні, забула зовсім"
        },
        {
          "mine": false,
          "text": "давай я подзвоню в кондитерську, знаю гарну"
        },
        {
          "mine": true,
          "text": "будь ласка, шоколадний якщо можна"
        },
        {
          "mine": false,
          "text": "домовлюсь, скину скільки вийде"
        }
      ]
    },
    {
      "name": "Богдан",
      "messages": [
        {
          "mine": true,
          "text": "богдан ти ноут полагодив?"
        },
        {
          "mine": false,
          "text": "ага, вентилятор міняв, тепер не шумить"
        },
        {
          "mine": true,
          "text": "круто, а мій глянеш якось?"
        },
        {
          "mine": false,
          "text": "неси, гляну що там"
        }
      ]
    },
    {
      "name": "Аня",
      "messages": [
        {
          "mine": false,
          "text": "погода жах, дощ цілий день"
        },
        {
          "mine": true,
          "text": "ага, парасолю ледве не забула"
        },
        {
          "mine": false,
          "text": "казали до вечора вщухне"
        },
        {
          "mine": true,
          "text": "дай боже, хотіла погуляти"
        }
      ]
    },
    {
      "name": "Роман",
      "messages": [
        {
          "mine": true,
          "text": "ром позич газонокосарку на вихідні?"
        },
        {
          "mine": false,
          "text": "бери, тільки бензин свій"
        },
        {
          "mine": true,
          "text": "без питань, коли забрати?"
        },
        {
          "mine": false,
          "text": "хоч зараз, я вдома"
        },
        {
          "mine": true,
          "text": "їду"
        }
      ]
    },
    {
      "name": "Ліда",
      "messages": [
        {
          "mine": false,
          "text": "рецепт вареників памʼятаєш? тісто в мене рветься"
        },
        {
          "mine": true,
          "text": "води менше додавай і дай тісту полежати"
        },
        {
          "mine": false,
          "text": "о, я одразу ліпила. спробую"
        },
        {
          "mine": true,
          "text": "хвилин 20 хай постоїть під рушником"
        },
        {
          "mine": false,
          "text": "дякую, рятувальнице"
        }
      ]
    },
    {
      "name": "Стоматолог",
      "messages": [
        {
          "mine": false,
          "text": "нагадуємо про візит завтра о 10:30"
        },
        {
          "mine": true,
          "text": "дякую, буду вчасно"
        },
        {
          "mine": false,
          "text": "не забудьте, натще не потрібно"
        },
        {
          "mine": true,
          "text": "зрозумів, до завтра"
        }
      ]
    },
    {
      "name": "Перукарка Віка",
      "messages": [
        {
          "mine": true,
          "text": "віка є вікно на стрижку цього тижня?"
        },
        {
          "mine": false,
          "text": "четвер о 16 вільно, підходить?"
        },
        {
          "mine": true,
          "text": "так, записуйте"
        },
        {
          "mine": false,
          "text": "записала, чекаю)"
        }
      ]
    },
    {
      "name": "Кум Василь",
      "messages": [
        {
          "mine": false,
          "text": "куме, картоплю копати коли будемо?"
        },
        {
          "mine": true,
          "text": "давай у суботу зранку, поки не спекотно"
        },
        {
          "mine": false,
          "text": "згода, я мішки приготую"
        },
        {
          "mine": true,
          "text": "а я вила візьму"
        }
      ]
    },
    {
      "name": "Кума Надя",
      "messages": [
        {
          "mine": true,
          "text": "надю варення абрикосове ще маєш?"
        },
        {
          "mine": false,
          "text": "маю банку, залишила тобі"
        },
        {
          "mine": true,
          "text": "ой дякую, дуже смачне в тебе"
        },
        {
          "mine": false,
          "text": "заходь на чай, віддам"
        }
      ]
    },
    {
      "name": "Льоша",
      "messages": [
        {
          "mine": false,
          "text": "ти квитки на потяг взяв на пʼятницю?"
        },
        {
          "mine": true,
          "text": "взяв, вагон 7 місця 21 і 22"
        },
        {
          "mine": false,
          "text": "супер, боковушки нема хоч?"
        },
        {
          "mine": true,
          "text": "ні, нормальні купе"
        },
        {
          "mine": false,
          "text": "красава"
        }
      ]
    },
    {
      "name": "Марина",
      "messages": [
        {
          "mine": true,
          "text": "марин у скільки завтра дитячий ранок?"
        },
        {
          "mine": false,
          "text": "о 10, костюм не забудь"
        },
        {
          "mine": true,
          "text": "точно, зайчик же. добре"
        },
        {
          "mine": false,
          "text": "фоткай багато, я запізнюсь трохи"
        }
      ]
    },
    {
      "name": "Ігор",
      "messages": [
        {
          "mine": false,
          "text": "здоров, шини поміняв на літні?"
        },
        {
          "mine": true,
          "text": "ще ні, треба записатись на шиномонтаж"
        },
        {
          "mine": false,
          "text": "я їздив до тих на обʼїзній, швидко зробили"
        },
        {
          "mine": true,
          "text": "дам знати, дякую за наводку"
        }
      ]
    },
    {
      "name": "Валя",
      "messages": [
        {
          "mine": true,
          "text": "валь ти на йогу сьогодні?"
        },
        {
          "mine": false,
          "text": "так, о 18:30. підходь"
        },
        {
          "mine": true,
          "text": "килимок з собою брати?"
        },
        {
          "mine": false,
          "text": "візьми свій, там мало дають"
        },
        {
          "mine": true,
          "text": "ок, до зустрічі"
        }
      ]
    },
    {
      "name": "Сергій",
      "messages": [
        {
          "mine": false,
          "text": "полиця та що ти вішав, тримається?"
        },
        {
          "mine": true,
          "text": "тримається чудово, дякую що допоміг"
        },
        {
          "mine": false,
          "text": "та нема за що, звертайся"
        },
        {
          "mine": true,
          "text": "з мене пиво якось"
        }
      ]
    },
    {
      "name": "Настя",
      "messages": [
        {
          "mine": true,
          "text": "насть ти сукню на випускний знайшла?"
        },
        {
          "mine": false,
          "text": "дві варіанти, не можу обрати"
        },
        {
          "mine": true,
          "text": "скинь фото, підкажу"
        },
        {
          "mine": false,
          "text": "зараз, тільки не смійся з мене))"
        },
        {
          "mine": true,
          "text": "та ти в будь чому красуня"
        }
      ]
    },
    {
      "name": "Толік",
      "messages": [
        {
          "mine": false,
          "text": "риболовля в неділю? кльов обіцяють"
        },
        {
          "mine": true,
          "text": "я за, о котрій виїзд?"
        },
        {
          "mine": false,
          "text": "о 5 ранку заберу тебе"
        },
        {
          "mine": true,
          "text": "рано, але хай буде. черв'яків маєш?"
        },
        {
          "mine": false,
          "text": "накопаю ввечері"
        }
      ]
    },
    {
      "name": "Зоя",
      "messages": [
        {
          "mine": true,
          "text": "зоя ти в аптеку йшла? купи вітамінки якщо є"
        },
        {
          "mine": false,
          "text": "які саме? там багато"
        },
        {
          "mine": true,
          "text": "ті що для дітей, у баночці помаранчевій"
        },
        {
          "mine": false,
          "text": "знайду, увечері занесу"
        },
        {
          "mine": true,
          "text": "дякую велике"
        }
      ]
    },
    {
      "name": "Гриша",
      "messages": [
        {
          "mine": false,
          "text": "комп знову гальмує, глянеш?"
        },
        {
          "mine": true,
          "text": "перезавантаж для початку"
        },
        {
          "mine": false,
          "text": "робив, не помогло"
        },
        {
          "mine": true,
          "text": "тоді заскоч ввечері, подивлюсь"
        },
        {
          "mine": false,
          "text": "ок, буду з ноутом"
        }
      ]
    },
    {
      "name": "Даша",
      "messages": [
        {
          "mine": true,
          "text": "даш підкажи хорошого майстра манікюру"
        },
        {
          "mine": false,
          "text": "є одна, скину контакт"
        },
        {
          "mine": false,
          "text": "тільки запис за тиждень, дуже популярна"
        },
        {
          "mine": true,
          "text": "нічого, дякую, запишусь"
        }
      ]
    },
    {
      "name": "Начальник",
      "messages": [
        {
          "mine": false,
          "text": "завтра можете вийти на годину раніше?"
        },
        {
          "mine": true,
          "text": "так, без проблем"
        },
        {
          "mine": false,
          "text": "дякую, треба склад прийняти"
        },
        {
          "mine": true,
          "text": "зрозумів, буду о восьмій"
        }
      ]
    },
    {
      "name": "Колега Дмитро",
      "messages": [
        {
          "mine": true,
          "text": "діма ти обід брав чи в їдальню?"
        },
        {
          "mine": false,
          "text": "в їдальню йду, приєднуйся"
        },
        {
          "mine": true,
          "text": "давай, там сьогодні борщ був"
        },
        {
          "mine": false,
          "text": "чекаю біля ліфта"
        }
      ]
    },
    {
      "name": "Тренер",
      "messages": [
        {
          "mine": false,
          "text": "тренування завтра переносимо на 19:00"
        },
        {
          "mine": true,
          "text": "прийняв, буду"
        },
        {
          "mine": false,
          "text": "форму не забудь і воду"
        },
        {
          "mine": true,
          "text": "все візьму, дякую"
        }
      ]
    },
    {
      "name": "Ветеринар",
      "messages": [
        {
          "mine": true,
          "text": "доброго дня, коту треба щеплення поставити"
        },
        {
          "mine": false,
          "text": "вітаю, запишу на четвер, зручно?"
        },
        {
          "mine": true,
          "text": "так, у першій половині дня можна?"
        },
        {
          "mine": false,
          "text": "об 11 підійде, чекаємо вас з котиком"
        },
        {
          "mine": true,
          "text": "дякую, будемо"
        }
      ]
    },
    {
      "name": "Механік Ваня",
      "messages": [
        {
          "mine": false,
          "text": "машина готова, колодки поміняли"
        },
        {
          "mine": true,
          "text": "супер, скільки вийшло?"
        },
        {
          "mine": false,
          "text": "як домовлялись, деталь і робота"
        },
        {
          "mine": true,
          "text": "заберу після роботи, дякую"
        }
      ]
    },
    {
      "name": "Таксист Артем",
      "messages": [
        {
          "mine": true,
          "text": "артем можете завтра о 7 ранку до аеропорту?"
        },
        {
          "mine": false,
          "text": "можу, чекайте біля підʼїзду"
        },
        {
          "mine": true,
          "text": "дякую, багажу два чемодани"
        },
        {
          "mine": false,
          "text": "влізе, машина велика"
        }
      ]
    },
    {
      "name": "Свекруха",
      "messages": [
        {
          "mine": false,
          "text": "приходьте в неділю на обід, голубці зроблю"
        },
        {
          "mine": true,
          "text": "з радістю, дякуємо. що принести?"
        },
        {
          "mine": false,
          "text": "нічого не треба, тільки апетит"
        },
        {
          "mine": true,
          "text": "тоді будемо о другій"
        }
      ]
    },
    {
      "name": "Теща",
      "messages": [
        {
          "mine": true,
          "text": "мам ви розсаду перцю вже пікірували?"
        },
        {
          "mine": false,
          "text": "так, гарна вийшла, і вам залишу"
        },
        {
          "mine": true,
          "text": "дякую, заберемо на вихідних"
        },
        {
          "mine": false,
          "text": "добре, чекаю вас"
        }
      ]
    },
    {
      "name": "Хрещена",
      "messages": [
        {
          "mine": false,
          "text": "як навчання? не хворієш?"
        },
        {
          "mine": true,
          "text": "все добре, здоровий, дякую"
        },
        {
          "mine": false,
          "text": "приїжджай у гості, скучила"
        },
        {
          "mine": true,
          "text": "обовʼязково цими вихідними"
        }
      ]
    },
    {
      "name": "Хрещений",
      "messages": [
        {
          "mine": true,
          "text": "хрещений допоможете шафу зібрати?"
        },
        {
          "mine": false,
          "text": "звісно, коли зручно?"
        },
        {
          "mine": true,
          "text": "може в суботу зранку?"
        },
        {
          "mine": false,
          "text": "домовились, викрутки свої візьму"
        }
      ]
    },
    {
      "name": "Однокласниця Лєра",
      "messages": [
        {
          "mine": false,
          "text": "зустріч класу через місяць, підтвердиш?"
        },
        {
          "mine": true,
          "text": "так, точно прийду, давно не бачились"
        },
        {
          "mine": false,
          "text": "супер, збираємось у тому ж кафе"
        },
        {
          "mine": true,
          "text": "класика) чекатиму"
        }
      ]
    },
    {
      "name": "Одногрупник Тимур",
      "messages": [
        {
          "mine": true,
          "text": "тимур конспект з минулої пари скинеш?"
        },
        {
          "mine": false,
          "text": "зараз сфоткаю, там багато формул"
        },
        {
          "mine": true,
          "text": "дякую, а то проспав будильник"
        },
        {
          "mine": false,
          "text": "буває) лови фотки"
        }
      ]
    },
    {
      "name": "Дядя Жора",
      "messages": [
        {
          "mine": false,
          "text": "приїжджай на рибалку, ляща ловимо"
        },
        {
          "mine": true,
          "text": "коли плануєте?"
        },
        {
          "mine": false,
          "text": "у неділю зранку, човен готовий"
        },
        {
          "mine": true,
          "text": "буду, снасті свої привезу"
        }
      ]
    },
    {
      "name": "Тьотя Валя",
      "messages": [
        {
          "mine": true,
          "text": "тьотю валю з днем народження! здоровʼя вам"
        },
        {
          "mine": false,
          "text": "ой дякую сонце, приходь на чай з тортом"
        },
        {
          "mine": true,
          "text": "прийду ввечері обовʼязково"
        },
        {
          "mine": false,
          "text": "чекатиму, спекла наполеон"
        }
      ]
    },
    {
      "name": "Ніна",
      "messages": [
        {
          "mine": false,
          "text": "ти сумку зі спортивного забрала? я лишила там"
        },
        {
          "mine": true,
          "text": "ні, глянь у роздягальні на лавці"
        },
        {
          "mine": false,
          "text": "точно, ось вона. фух, дякую"
        },
        {
          "mine": true,
          "text": "добре що знайшлась)"
        }
      ]
    },
    {
      "name": "Павло",
      "messages": [
        {
          "mine": true,
          "text": "паша ти дачу продав чи ще думаєш?"
        },
        {
          "mine": false,
          "text": "ще думаю, шкода яблунь"
        },
        {
          "mine": true,
          "text": "та залиш, гарне ж місце"
        },
        {
          "mine": false,
          "text": "мабуть ти правий, лишу"
        }
      ]
    },
    {
      "name": "Костя",
      "messages": [
        {
          "mine": false,
          "text": "ключі від гаража в тебе ще?"
        },
        {
          "mine": true,
          "text": "так, забув віддати, вибач"
        },
        {
          "mine": true,
          "text": "завтра занесу"
        },
        {
          "mine": false,
          "text": "нема куди спішити, дякую"
        }
      ]
    },
    {
      "name": "Віталік",
      "messages": [
        {
          "mine": true,
          "text": "віталь ти пилосос новий брав, який порадиш?"
        },
        {
          "mine": false,
          "text": "бери з контейнером, з мішками морока"
        },
        {
          "mine": false,
          "text": "у мене вже рік, задоволений"
        },
        {
          "mine": true,
          "text": "дякую, гляну такий"
        }
      ]
    },
    {
      "name": "Аліна",
      "messages": [
        {
          "mine": false,
          "text": "йдеш завтра на пробіжку в парк?"
        },
        {
          "mine": true,
          "text": "хочу, о котрій?"
        },
        {
          "mine": false,
          "text": "о 7 зустрінемось біля фонтану"
        },
        {
          "mine": true,
          "text": "буду, тільки не проспи знову))"
        },
        {
          "mine": false,
          "text": "цього разу точно ні!"
        }
      ]
    },
    {
      "name": "Руслан",
      "messages": [
        {
          "mine": true,
          "text": "русл підкинеш ящик з інструментами додому?"
        },
        {
          "mine": false,
          "text": "легко, я на машині сьогодні"
        },
        {
          "mine": true,
          "text": "дякую, після пʼятої зручно"
        },
        {
          "mine": false,
          "text": "ок, наберу як звільнюсь"
        }
      ]
    },
    {
      "name": "Софійка",
      "messages": [
        {
          "mine": false,
          "text": "мам можна до подружки після школи?"
        },
        {
          "mine": true,
          "text": "можна, але до сьомої вдома"
        },
        {
          "mine": false,
          "text": "добре, обіцяю"
        },
        {
          "mine": true,
          "text": "і уроки не забудь"
        },
        {
          "mine": false,
          "text": "памʼятаю, зроблю ввечері"
        }
      ]
    },
    {
      "name": "Данило",
      "messages": [
        {
          "mine": true,
          "text": "даня ти на пару йдеш чи прогулюєм?"
        },
        {
          "mine": false,
          "text": "йду, лаба важлива"
        },
        {
          "mine": true,
          "text": "тоді і я. каву по дорозі?"
        },
        {
          "mine": false,
          "text": "давай, зустрінемось біля метро"
        }
      ]
    },
    {
      "name": "Лариса",
      "messages": [
        {
          "mine": false,
          "text": "занавіски забрала з хімчистки?"
        },
        {
          "mine": true,
          "text": "так, висять уже, як нові"
        },
        {
          "mine": false,
          "text": "от і добре, дякую що заскочила"
        },
        {
          "mine": true,
          "text": "по дорозі було, не проблема"
        }
      ]
    },
    {
      "name": "Микола",
      "messages": [
        {
          "mine": true,
          "text": "коль паркан фарбувати коли будемо?"
        },
        {
          "mine": false,
          "text": "давай у вихідні, поки погода суха"
        },
        {
          "mine": false,
          "text": "фарбу я купив, валики теж"
        },
        {
          "mine": true,
          "text": "чудово, я приїду зранку"
        }
      ]
    },
    {
      "name": "Галина Петрівна",
      "messages": [
        {
          "mine": false,
          "text": "квартплату за цей місяць вже сплатили?"
        },
        {
          "mine": true,
          "text": "так, вчора провів, квитанція є"
        },
        {
          "mine": false,
          "text": "дякую, тоді все гаразд"
        },
        {
          "mine": true,
          "text": "гарного дня"
        }
      ]
    },
    {
      "name": "Сусід зверху",
      "messages": [
        {
          "mine": true,
          "text": "добрий вечір, у вас часом не тече? стеля мокра"
        },
        {
          "mine": false,
          "text": "ой, зараз гляну машинку, вибачте"
        },
        {
          "mine": false,
          "text": "точно шланг, перекрив. завтра майстра викличу"
        },
        {
          "mine": true,
          "text": "дякую, головне що знайшли причину"
        }
      ]
    },
    {
      "name": "Курʼєр",
      "messages": [
        {
          "mine": false,
          "text": "вітаю, ваша посилка, буду за 15 хвилин"
        },
        {
          "mine": true,
          "text": "добре, я вдома, підʼїзд другий"
        },
        {
          "mine": false,
          "text": "код домофону підкажіть?"
        },
        {
          "mine": true,
          "text": "зараз відчиню, подзвоніть як будете"
        }
      ]
    },
    {
      "name": "Соня",
      "messages": [
        {
          "mine": true,
          "text": "сонь ти светр мій не бачила після вечірки?"
        },
        {
          "mine": false,
          "text": "здається лишився в мене, синій?"
        },
        {
          "mine": true,
          "text": "так він! заберу коли зустрінемось"
        },
        {
          "mine": false,
          "text": "давай завтра на каві"
        }
      ]
    },
    {
      "name": "Марʼяна",
      "messages": [
        {
          "mine": false,
          "text": "малий температурить, до садка не поведу"
        },
        {
          "mine": true,
          "text": "ой, видужуйте. чаю з малиною"
        },
        {
          "mine": false,
          "text": "дякую, вже даю. напевно застудився"
        },
        {
          "mine": true,
          "text": "бережіть себе, як щось потрібно кажи"
        }
      ]
    },
    {
      "name": "Артем К.",
      "messages": [
        {
          "mine": true,
          "text": "тьom ти на роботі завтра до котрої?"
        },
        {
          "mine": false,
          "text": "до шостої, а що?"
        },
        {
          "mine": true,
          "text": "хотів заскочити, документи віддати"
        },
        {
          "mine": false,
          "text": "заходь до пʼятої, буду на місці"
        }
      ]
    },
    {
      "name": "Влад",
      "messages": [
        {
          "mine": false,
          "text": "го в боулінг у пʼятницю, компанія збирається"
        },
        {
          "mine": true,
          "text": "я за! о котрій?"
        },
        {
          "mine": false,
          "text": "о 20, доріжку забронював"
        },
        {
          "mine": true,
          "text": "клас, буду"
        }
      ]
    },
    {
      "name": "Ксюша",
      "messages": [
        {
          "mine": true,
          "text": "ксюш порадь серіал на вечір, щось легке"
        },
        {
          "mine": false,
          "text": "глянь ту нову комедію, ми ржали весь вечір"
        },
        {
          "mine": true,
          "text": "о дякую, ввімкну сьогодні"
        },
        {
          "mine": false,
          "text": "потім розкажеш як тобі"
        }
      ]
    },
    {
      "name": "Юрій",
      "messages": [
        {
          "mine": false,
          "text": "стелаж привезли, допоможеш занести?"
        },
        {
          "mine": true,
          "text": "звісно, зараз спущусь"
        },
        {
          "mine": false,
          "text": "важкий трохи, вдвох легше буде"
        },
        {
          "mine": true,
          "text": "вже йду"
        }
      ]
    },
    {
      "name": "Оленка",
      "messages": [
        {
          "mine": true,
          "text": "оленко ти замовила квіти мамі на ювілей?"
        },
        {
          "mine": false,
          "text": "ще ні, які думаєш взяти?"
        },
        {
          "mine": true,
          "text": "може півонії, вона їх любить"
        },
        {
          "mine": false,
          "text": "точно! замовлю букет сьогодні"
        },
        {
          "mine": true,
          "text": "дякую, з мене доставка"
        }
      ]
    },
    {
      "name": "Дениска",
      "messages": [
        {
          "mine": false,
          "text": "тат можна нову гру завантажити?"
        },
        {
          "mine": true,
          "text": "спершу уроки, потім гра"
        },
        {
          "mine": false,
          "text": "уроки вже зробив, чесно"
        },
        {
          "mine": true,
          "text": "тоді годинку, не більше"
        },
        {
          "mine": false,
          "text": "домовились, дякую!"
        }
      ]
    },
    {
      "name": "Люба",
      "messages": [
        {
          "mine": true,
          "text": "люб ти на базар йдеш? полуниця зʼявилась"
        },
        {
          "mine": false,
          "text": "йду зранку, взяти тобі?"
        },
        {
          "mine": true,
          "text": "візьми кілограм, на варення"
        },
        {
          "mine": false,
          "text": "добре, гляну щоб солодка була"
        }
      ]
    },
    {
      "name": "Ростик",
      "messages": [
        {
          "mine": false,
          "text": "велик мій ще в тебе стоїть у гаражі?"
        },
        {
          "mine": true,
          "text": "стоїть, колесо тільки підкачати треба"
        },
        {
          "mine": true,
          "text": "хочеш приїзди, разом накачаєм"
        },
        {
          "mine": false,
          "text": "давай завтра, погода супер для покатушок"
        }
      ]
    },
    {
      "name": "Віра",
      "messages": [
        {
          "mine": true,
          "text": "вір ти рецепт заправки для салату скидала?"
        },
        {
          "mine": false,
          "text": "олія, гірчиця, мед і лимон, збий все разом"
        },
        {
          "mine": true,
          "text": "о, звучить смачно, спробую"
        },
        {
          "mine": false,
          "text": "часничок ще додай, буде вогонь"
        }
      ]
    },
    {
      "name": "Тьотя Рая",
      "messages": [
        {
          "mine": false,
          "text": "як там дітки? ростуть?"
        },
        {
          "mine": true,
          "text": "ростуть як на дріжджах, старший вже читає"
        },
        {
          "mine": false,
          "text": "ой розумничок, привіт їм передавай"
        },
        {
          "mine": true,
          "text": "передам, приїжджайте в гості"
        }
      ]
    },
    {
      "name": "Матвій",
      "messages": [
        {
          "mine": true,
          "text": "матв ти на тренуванні був? що задавали?"
        },
        {
          "mine": false,
          "text": "розтяжку робити щодня і присідання"
        },
        {
          "mine": true,
          "text": "ех, а я пропустив. дякую що сказав"
        },
        {
          "mine": false,
          "text": "не забивай, тренер питатиме"
        }
      ]
    },
    {
      "name": "Злата",
      "messages": [
        {
          "mine": false,
          "text": "підеш зі мною обирати шпалери в суботу?"
        },
        {
          "mine": true,
          "text": "піду, люблю таке. який колір хочеш?"
        },
        {
          "mine": false,
          "text": "думаю світлі, щоб кімната більша здавалась"
        },
        {
          "mine": true,
          "text": "гарна ідея, підкажу як прийдемо"
        }
      ]
    },
    {
      "name": "Гоша",
      "messages": [
        {
          "mine": true,
          "text": "гош де ти таку куртку брав? класна"
        },
        {
          "mine": false,
          "text": "в магазині біля роботи, там знижки зараз"
        },
        {
          "mine": true,
          "text": "о, збігаю гляну після зміни"
        },
        {
          "mine": false,
          "text": "поспіши, розхапують швидко"
        }
      ]
    },
    {
      "name": "Інна",
      "messages": [
        {
          "mine": false,
          "text": "ти книжку в бібліотеку здала? термін завтра"
        },
        {
          "mine": true,
          "text": "ой ні, забула зовсім. дякую що нагадала"
        },
        {
          "mine": true,
          "text": "завтра одразу занесу"
        },
        {
          "mine": false,
          "text": "встигни, бо штраф"
        }
      ]
    },
    {
      "name": "Пашка",
      "messages": [
        {
          "mine": true,
          "text": "паш ти на шашлики їдеш у неділю?"
        },
        {
          "mine": false,
          "text": "їду, мангал з мене"
        },
        {
          "mine": true,
          "text": "а я салати і овочі привезу"
        },
        {
          "mine": false,
          "text": "красава, збираємось о 12"
        }
      ]
    },
    {
      "name": "Клава",
      "messages": [
        {
          "mine": false,
          "text": "нитки для вʼязання не лишились у тебе?"
        },
        {
          "mine": true,
          "text": "є трохи сірих, підійдуть?"
        },
        {
          "mine": false,
          "text": "так, саме шапку доплітаю"
        },
        {
          "mine": true,
          "text": "занесу завтра, все одно поруч буду"
        }
      ]
    },
    {
      "name": "Йосип",
      "messages": [
        {
          "mine": true,
          "text": "йосип ви дрова на зиму замовили?"
        },
        {
          "mine": false,
          "text": "замовив, привезуть наступного тижня"
        },
        {
          "mine": false,
          "text": "як привезуть, поможеш скласти?"
        },
        {
          "mine": true,
          "text": "звісно, кажіть день"
        }
      ]
    },
    {
      "name": "Емма",
      "messages": [
        {
          "mine": false,
          "text": "у нас закінчився корм для собаки, купиш?"
        },
        {
          "mine": true,
          "text": "куплю, той самий що завжди?"
        },
        {
          "mine": false,
          "text": "так, великий пакет бери"
        },
        {
          "mine": true,
          "text": "добре, заскочу в зоомагазин"
        }
      ]
    },
    {
      "name": "Захар",
      "messages": [
        {
          "mine": true,
          "text": "захар ти телевізор новий налаштував?"
        },
        {
          "mine": false,
          "text": "майже, канали не всі ловить"
        },
        {
          "mine": true,
          "text": "антену перевір, часто в ній справа"
        },
        {
          "mine": false,
          "text": "точно, гляну зараз, дякую"
        }
      ]
    },
    {
      "name": "Ярина",
      "messages": [
        {
          "mine": false,
          "text": "печеш щось на свято? я пиріг з яблуками хочу"
        },
        {
          "mine": true,
          "text": "давай ти пиріг, а я салати візьму"
        },
        {
          "mine": false,
          "text": "ідеально, поділимо клопіт"
        },
        {
          "mine": true,
          "text": "так простіше, домовились"
        }
      ]
    },
    {
      "name": "Остап",
      "messages": [
        {
          "mine": true,
          "text": "остап ти лижі свої де зберігаєш влітку?"
        },
        {
          "mine": false,
          "text": "на балконі в чохлі, головне від сонця"
        },
        {
          "mine": true,
          "text": "а мазь потрібна?"
        },
        {
          "mine": false,
          "text": "перед сезоном оброблю, зараз ні"
        }
      ]
    },
    {
      "name": "Уляна",
      "messages": [
        {
          "mine": false,
          "text": "ти на весілля що вдягнеш? я в паніці"
        },
        {
          "mine": true,
          "text": "думаю ту зелену сукню, а ти?"
        },
        {
          "mine": false,
          "text": "ой не знаю, нічого не підходить"
        },
        {
          "mine": true,
          "text": "заскоч до мене, поміряєш мої разом"
        },
        {
          "mine": false,
          "text": "ти рятівниця, прийду ввечері"
        }
      ]
    },
    {
      "name": "Федір",
      "messages": [
        {
          "mine": true,
          "text": "федь ти генератор налагодив?"
        },
        {
          "mine": false,
          "text": "так, свічку поміняв, тепер заводиться з пів оберта"
        },
        {
          "mine": true,
          "text": "круто, а то в мене теж капризує"
        },
        {
          "mine": false,
          "text": "привези, гляну що там"
        }
      ]
    },
    {
      "name": "Ярослав",
      "messages": [
        {
          "mine": false,
          "text": "го в басейн завтра поплавати?"
        },
        {
          "mine": true,
          "text": "давай, о котрій відкриття?"
        },
        {
          "mine": false,
          "text": "о 8, встигнемо до роботи"
        },
        {
          "mine": true,
          "text": "шапочку і окуляри не забути"
        },
        {
          "mine": false,
          "text": "точно, зустрінемось на вході"
        }
      ]
    },
    {
      "name": "Ліза",
      "messages": [
        {
          "mine": true,
          "text": "ліз де ти той плед пухнастий брала?"
        },
        {
          "mine": false,
          "text": "в тому магазині товарів для дому"
        },
        {
          "mine": true,
          "text": "хочу такий же, зимою тепло з ним"
        },
        {
          "mine": false,
          "text": "бери, реально приємний, я в захваті"
        }
      ]
    },
    {
      "name": "Зіна",
      "messages": [
        {
          "mine": false,
          "text": "розсаду помідорів висадила вже?"
        },
        {
          "mine": true,
          "text": "ще ні, боюсь заморозків"
        },
        {
          "mine": false,
          "text": "правильно, зачекай тижнів зо два"
        },
        {
          "mine": true,
          "text": "так і зроблю, дякую за пораду"
        }
      ]
    },
    {
      "name": "Едик",
      "messages": [
        {
          "mine": true,
          "text": "едік підкажи де недорого шини поміняти"
        },
        {
          "mine": false,
          "text": "є хлопці на заправці, роблять швидко"
        },
        {
          "mine": true,
          "text": "скинеш де саме?"
        },
        {
          "mine": false,
          "text": "зараз локацію відправлю"
        }
      ]
    },
    {
      "name": "Марта",
      "messages": [
        {
          "mine": false,
          "text": "зустрінемось на каві в неділю? давно не бачились"
        },
        {
          "mine": true,
          "text": "з радістю! о котрій зручно?"
        },
        {
          "mine": false,
          "text": "давай об 11, у тому затишному місці"
        },
        {
          "mine": true,
          "text": "чудово, буду. стільки розповісти хочу"
        },
        {
          "mine": false,
          "text": "і мені! до неділі"
        }
      ]
    },
    {
      "name": "Гена",
      "messages": [
        {
          "mine": true,
          "text": "ген ти драбину позичиш? стелю треба побілити"
        },
        {
          "mine": false,
          "text": "бери, стоїть у сараї"
        },
        {
          "mine": true,
          "text": "дякую, заберу сьогодні"
        },
        {
          "mine": false,
          "text": "тільки поверни, я теж скоро ремонт затіваю"
        }
      ]
    }
  ],
  "tr": [
    {
      "name": "Anne",
      "messages": [
        {
          "mine": false,
          "text": "kızım akşama gelecek misin yemeğe"
        },
        {
          "mine": true,
          "text": "gelirim anne ama biraz geç olur işten 7 gibi çıkıyorum"
        },
        {
          "mine": false,
          "text": "tamam o zaman fasulye yapayım seversin"
        },
        {
          "mine": true,
          "text": "ay çok iyi olur ekmek de alayım mı"
        },
        {
          "mine": false,
          "text": "al bir tane taze"
        },
        {
          "mine": true,
          "text": "tamam görüşürüz öptüm"
        }
      ]
    },
    {
      "name": "Baba",
      "messages": [
        {
          "mine": true,
          "text": "baba arabanın muayenesi ne zaman bitiyordu"
        },
        {
          "mine": false,
          "text": "gelecek ay 15inde galiba bakayım ruhsata"
        },
        {
          "mine": false,
          "text": "evet 14 son gün"
        },
        {
          "mine": true,
          "text": "o zaman erken halledelim kuyruk olmasın"
        },
        {
          "mine": false,
          "text": "hafta sonu gideriz beraber"
        }
      ]
    },
    {
      "name": "Babaanne",
      "messages": [
        {
          "mine": false,
          "text": "yavrum reçeli aldın mı dolaba koydun mu"
        },
        {
          "mine": true,
          "text": "aldım babaanne rafa dizdim hepsini"
        },
        {
          "mine": false,
          "text": "aferin sana kayısılıyı sakla bana"
        },
        {
          "mine": true,
          "text": "tamam senin için ayırdım zaten"
        },
        {
          "mine": false,
          "text": "sağ ol canım eline sağlık"
        }
      ]
    },
    {
      "name": "Anneanne",
      "messages": [
        {
          "mine": true,
          "text": "anneanne pazar günü sana uğrarız çocuklarla"
        },
        {
          "mine": false,
          "text": "gelin gelin böreğinizi yaparım"
        },
        {
          "mine": true,
          "text": "yaa ıspanaklı olsun lütfen"
        },
        {
          "mine": false,
          "text": "olur senin sevdiğinden"
        },
        {
          "mine": true,
          "text": "öptüm kokunu özledik"
        }
      ]
    },
    {
      "name": "Dede",
      "messages": [
        {
          "mine": false,
          "text": "oğlum televizyonun kumandası yine çalışmıyor"
        },
        {
          "mine": true,
          "text": "pili bitmiştir dede yenisini getireyim akşam"
        },
        {
          "mine": false,
          "text": "getir de maçı kaçırmayayım"
        },
        {
          "mine": true,
          "text": "yolda alırım merak etme"
        },
        {
          "mine": false,
          "text": "eyvallah"
        }
      ]
    },
    {
      "name": "Abla",
      "messages": [
        {
          "mine": true,
          "text": "abla annemin doğum gününe ne alsak"
        },
        {
          "mine": false,
          "text": "geçen şala bakıyordu hani lacivert olan"
        },
        {
          "mine": true,
          "text": "iyi fikir ortak alalım mı"
        },
        {
          "mine": false,
          "text": "olur sen bak ben paranı veririm"
        },
        {
          "mine": true,
          "text": "tamam yarın çıkarım bakmaya"
        },
        {
          "mine": false,
          "text": "süper haber ver"
        }
      ]
    },
    {
      "name": "Abi",
      "messages": [
        {
          "mine": false,
          "text": "kardeş bu akşam maça geliyor musun"
        },
        {
          "mine": true,
          "text": "gelemem abi yarın erken kalkıcam"
        },
        {
          "mine": false,
          "text": "yaa bir dahaki sefere o zaman"
        },
        {
          "mine": true,
          "text": "olur sen keyfine bak skoru yaz bana"
        },
        {
          "mine": false,
          "text": "yazarım tabii"
        }
      ]
    },
    {
      "name": "Teyze",
      "messages": [
        {
          "mine": false,
          "text": "canım bayramda bize gelin size hasret kaldık"
        },
        {
          "mine": true,
          "text": "geliriz teyzem ilk gün size uğrarız"
        },
        {
          "mine": false,
          "text": "çok sevindim baklava yaparım"
        },
        {
          "mine": true,
          "text": "ellerine sağlık şimdiden"
        },
        {
          "mine": false,
          "text": "bekleriz görüşürüz"
        }
      ]
    },
    {
      "name": "Hala",
      "messages": [
        {
          "mine": true,
          "text": "hala düğün ne zamandı hatırlatır mısın"
        },
        {
          "mine": false,
          "text": "ayın 22si cumartesi salon şehir merkezinde"
        },
        {
          "mine": true,
          "text": "tamam not aldım kıyafet giyinip geliriz"
        },
        {
          "mine": false,
          "text": "olur bekleriz canım"
        }
      ]
    },
    {
      "name": "Amca",
      "messages": [
        {
          "mine": false,
          "text": "yeğenim bahçeye fidan diktik gel bir gör"
        },
        {
          "mine": true,
          "text": "vay amca ne diktin"
        },
        {
          "mine": false,
          "text": "kiraz ve erik birkaç tane de asma"
        },
        {
          "mine": true,
          "text": "harika olmuş hafta sonu gelirim"
        },
        {
          "mine": false,
          "text": "gel de mangal yakalım"
        },
        {
          "mine": true,
          "text": "oldu bil beni"
        }
      ]
    },
    {
      "name": "Dayı",
      "messages": [
        {
          "mine": true,
          "text": "dayı köye ne zaman gidiyorsunuz"
        },
        {
          "mine": false,
          "text": "cuma akşamı yola çıkarız"
        },
        {
          "mine": true,
          "text": "biz de gelsek olur mu"
        },
        {
          "mine": false,
          "text": "tabii gelin yer bol"
        },
        {
          "mine": true,
          "text": "süper o zaman ayarlıyoruz"
        }
      ]
    },
    {
      "name": "Kuzen Selin",
      "messages": [
        {
          "mine": false,
          "text": "cumartesi kahve içmeye çıkalım mı"
        },
        {
          "mine": true,
          "text": "çıkalım nerede buluşalım"
        },
        {
          "mine": false,
          "text": "alışveriş merkezindeki yer olur mu 2 gibi"
        },
        {
          "mine": true,
          "text": "olur ben biraz geç kalabilirim beklersin"
        },
        {
          "mine": false,
          "text": "beklerim sorun değil"
        },
        {
          "mine": true,
          "text": "süper görüşürüz"
        }
      ]
    },
    {
      "name": "Kuzen Emre",
      "messages": [
        {
          "mine": true,
          "text": "emre matkabını bir kaç günlüğüne alabilir miyim"
        },
        {
          "mine": false,
          "text": "tabii al ne yapıcan"
        },
        {
          "mine": false,
          "text": "raf mı asıcan"
        },
        {
          "mine": true,
          "text": "evet mutfağa raf takıcam"
        },
        {
          "mine": false,
          "text": "uçları da yanında geç uğra al"
        },
        {
          "mine": true,
          "text": "sağ ol akşam gelirim"
        }
      ]
    },
    {
      "name": "Ayşe",
      "messages": [
        {
          "mine": false,
          "text": "yarın yürüyüşe çıkalım mı sahilde"
        },
        {
          "mine": true,
          "text": "çıkalım saat kaçta"
        },
        {
          "mine": false,
          "text": "sabah 8 serin olur"
        },
        {
          "mine": true,
          "text": "biraz erken ama tamam kalkarım"
        },
        {
          "mine": false,
          "text": "su almayı unutma"
        },
        {
          "mine": true,
          "text": "aldım bile görüşürüz"
        }
      ]
    },
    {
      "name": "Fatma",
      "messages": [
        {
          "mine": true,
          "text": "fatmacığım o kek tarifini atar mısın"
        },
        {
          "mine": false,
          "text": "tabii hemen yazıyorum bekle"
        },
        {
          "mine": false,
          "text": "3 yumurta 1 su bardağı şeker yarım bardak yağ"
        },
        {
          "mine": true,
          "text": "un ne kadar"
        },
        {
          "mine": false,
          "text": "2 bardak un bir de kabartma tozu"
        },
        {
          "mine": true,
          "text": "çok sağ ol bu akşam denerim"
        }
      ]
    },
    {
      "name": "Mehmet",
      "messages": [
        {
          "mine": false,
          "text": "abi yarın vardiya kaçta başlıyor"
        },
        {
          "mine": true,
          "text": "sabah 9 galiba çizelgeye bakayım"
        },
        {
          "mine": true,
          "text": "evet 9 doğru"
        },
        {
          "mine": false,
          "text": "tamam o zaman beraber gideriz"
        },
        {
          "mine": true,
          "text": "olur köşede bekle seni alırım"
        }
      ]
    },
    {
      "name": "Elif",
      "messages": [
        {
          "mine": true,
          "text": "elif kitabı bitirdin mi geri istiyorlar kütüphaneden"
        },
        {
          "mine": false,
          "text": "bitirdim yarın getiririm"
        },
        {
          "mine": true,
          "text": "süper okulda buluşuruz"
        },
        {
          "mine": false,
          "text": "olur çantama koydum bile"
        }
      ]
    },
    {
      "name": "Zeynep",
      "messages": [
        {
          "mine": false,
          "text": "bu hafta sonu pikniğe var mısın"
        },
        {
          "mine": true,
          "text": "hava nasıl olacak diye bakayım"
        },
        {
          "mine": false,
          "text": "güneşliymiş baktım"
        },
        {
          "mine": true,
          "text": "o zaman varım ne getireyim"
        },
        {
          "mine": false,
          "text": "sen köfte yap ben salata"
        },
        {
          "mine": true,
          "text": "anlaştık"
        }
      ]
    },
    {
      "name": "Merve",
      "messages": [
        {
          "mine": true,
          "text": "merve saç kestirdim ne oldu bak"
        },
        {
          "mine": false,
          "text": "çok yakışmış çok tatlı olmuş"
        },
        {
          "mine": true,
          "text": "sağ ol biraz kısa geldi ama alışırım"
        },
        {
          "mine": false,
          "text": "yok çok güzel olmuş bence"
        },
        {
          "mine": true,
          "text": "iyi ki sordum sana"
        }
      ]
    },
    {
      "name": "Burak",
      "messages": [
        {
          "mine": false,
          "text": "kardeşim yarın halı sahaya eksik miyiz"
        },
        {
          "mine": true,
          "text": "bir kişi eksik gibi çağırayım birini"
        },
        {
          "mine": false,
          "text": "tamam saat 8 sahada olalım"
        },
        {
          "mine": true,
          "text": "olur ben forma getiririm yedek de var"
        },
        {
          "mine": false,
          "text": "sağ ol görüşürüz"
        }
      ]
    },
    {
      "name": "Deniz",
      "messages": [
        {
          "mine": true,
          "text": "deniz akşam ders çalışacak mıyız beraber"
        },
        {
          "mine": false,
          "text": "çalışalım matematikten takıldığım yerler var"
        },
        {
          "mine": true,
          "text": "tamam 7 de görüntülü açarız"
        },
        {
          "mine": false,
          "text": "olur defterimi hazırlıyorum"
        }
      ]
    },
    {
      "name": "Ece",
      "messages": [
        {
          "mine": false,
          "text": "kuaföre gidiyorum sen de gelir misin"
        },
        {
          "mine": true,
          "text": "randevun kaçta"
        },
        {
          "mine": false,
          "text": "3 te bir de sana ayarlarım"
        },
        {
          "mine": true,
          "text": "olur boyatmam lazım zaten"
        },
        {
          "mine": false,
          "text": "süper araya seni de yazdırdım"
        },
        {
          "mine": true,
          "text": "sağ ol görüşürüz orada"
        }
      ]
    },
    {
      "name": "Can",
      "messages": [
        {
          "mine": true,
          "text": "can taşınma günü yardıma gelebilir misin"
        },
        {
          "mine": false,
          "text": "gelirim ne zaman"
        },
        {
          "mine": false,
          "text": "cumartesi mi"
        },
        {
          "mine": true,
          "text": "evet sabah kamyonet geliyor"
        },
        {
          "mine": false,
          "text": "tamam erkenden oradayım"
        },
        {
          "mine": true,
          "text": "çok sağ ol borçlandım"
        }
      ]
    },
    {
      "name": "Cem",
      "messages": [
        {
          "mine": false,
          "text": "abi arabayı yıkatmaya gidiyorum senin de yıkatayım mı"
        },
        {
          "mine": true,
          "text": "yaa çok iyi olur çamur içinde"
        },
        {
          "mine": true,
          "text": "anahtarı kapıcıya bıraktım"
        },
        {
          "mine": false,
          "text": "aldım hallederim"
        },
        {
          "mine": true,
          "text": "eyvallah ne kadar olursa yollarım"
        }
      ]
    },
    {
      "name": "Seda",
      "messages": [
        {
          "mine": true,
          "text": "seda çocukları kim alacak okuldan bugün"
        },
        {
          "mine": false,
          "text": "ben alırım işim erken bitti"
        },
        {
          "mine": true,
          "text": "çok iyi oldu ben de yetişemiyordum"
        },
        {
          "mine": false,
          "text": "merak etme parkta biraz oynatırım"
        },
        {
          "mine": true,
          "text": "sağ ol akşam görüşürüz"
        }
      ]
    },
    {
      "name": "Gizem",
      "messages": [
        {
          "mine": false,
          "text": "yarın markete gidiyorum bir şey lazım mı"
        },
        {
          "mine": true,
          "text": "süt ve yumurta alır mısın bittiler"
        },
        {
          "mine": false,
          "text": "alırım başka"
        },
        {
          "mine": true,
          "text": "bir de deterjan olursa süper"
        },
        {
          "mine": false,
          "text": "not aldım geç gelirim ama"
        },
        {
          "mine": true,
          "text": "sorun değil sağ ol"
        }
      ]
    },
    {
      "name": "Kaan",
      "messages": [
        {
          "mine": true,
          "text": "kaan bisikletin lastiği patladı tamir yeri biliyor musun"
        },
        {
          "mine": false,
          "text": "köşedeki dükkan bakar hemen yapar"
        },
        {
          "mine": true,
          "text": "açık mıydı bu saatte"
        },
        {
          "mine": false,
          "text": "akşam 7 ye kadar açık"
        },
        {
          "mine": true,
          "text": "tamam koşturayım o zaman"
        }
      ]
    },
    {
      "name": "Berk",
      "messages": [
        {
          "mine": false,
          "text": "hafta sonu dağ evine gidelim mi kalabalık"
        },
        {
          "mine": true,
          "text": "kaç kişiyiz"
        },
        {
          "mine": false,
          "text": "6 kişi olduk araba iki tane"
        },
        {
          "mine": true,
          "text": "güzel olur ben erzak listesi yapayım"
        },
        {
          "mine": false,
          "text": "yap paylaşırız masrafı"
        },
        {
          "mine": true,
          "text": "tamam akşam gönderirim listeyi"
        }
      ]
    },
    {
      "name": "Ceren",
      "messages": [
        {
          "mine": true,
          "text": "ceren bebek için hediye baktın mı"
        },
        {
          "mine": false,
          "text": "baktım bir battaniye takımı buldum çok tatlı"
        },
        {
          "mine": false,
          "text": "beğenirsen linkini atarım"
        },
        {
          "mine": true,
          "text": "at bir bakayım rengi ne"
        },
        {
          "mine": false,
          "text": "sarı nötr olsun dedim"
        },
        {
          "mine": true,
          "text": "iyi düşünmüşsün alalım"
        }
      ]
    },
    {
      "name": "Ozan",
      "messages": [
        {
          "mine": false,
          "text": "toplantı saat kaça alındı"
        },
        {
          "mine": true,
          "text": "2 den 3 e çekilmiş mail geldi"
        },
        {
          "mine": false,
          "text": "off benim başka işim vardı"
        },
        {
          "mine": true,
          "text": "notları sana iletirim merak etme"
        },
        {
          "mine": false,
          "text": "çok sağ ol kurtardın"
        }
      ]
    },
    {
      "name": "Tesisatçı Ahmet",
      "messages": [
        {
          "mine": true,
          "text": "ahmet usta banyoda musluk damlıyor gelebilir misin"
        },
        {
          "mine": false,
          "text": "yarın öğleden sonra uygun musunuz"
        },
        {
          "mine": true,
          "text": "uygunum 2 gibi gelin"
        },
        {
          "mine": false,
          "text": "tamam conta getiririm hallederiz"
        },
        {
          "mine": true,
          "text": "sağ olun bekliyorum"
        }
      ]
    },
    {
      "name": "Elektrikçi Hasan",
      "messages": [
        {
          "mine": true,
          "text": "hasan usta salondaki priz çalışmıyor"
        },
        {
          "mine": false,
          "text": "sigortaya baktınız mı atmış olabilir"
        },
        {
          "mine": true,
          "text": "baktım sigorta normal"
        },
        {
          "mine": false,
          "text": "o zaman geleyim bir bakayım perşembe olur mu"
        },
        {
          "mine": true,
          "text": "olur öğlen bekliyorum"
        }
      ]
    },
    {
      "name": "Komşu Nurten",
      "messages": [
        {
          "mine": false,
          "text": "kızım biraz tuz alabilir miyim bitmiş"
        },
        {
          "mine": true,
          "text": "tabii nurten teyze getireyim kapıya"
        },
        {
          "mine": false,
          "text": "sağ ol canım az olsun yeter"
        },
        {
          "mine": true,
          "text": "önemli değil bol bol var"
        },
        {
          "mine": false,
          "text": "eline sağlık yarın iade ederim"
        }
      ]
    },
    {
      "name": "Komşu Hanım",
      "messages": [
        {
          "mine": true,
          "text": "merhaba yarın apartman toplantısı var mıydı"
        },
        {
          "mine": false,
          "text": "evet akşam 8 de girişte"
        },
        {
          "mine": true,
          "text": "gündem ne acaba"
        },
        {
          "mine": false,
          "text": "asansör bakımı ve aidat konuşulacak"
        },
        {
          "mine": true,
          "text": "anladım katılırım o zaman"
        }
      ]
    },
    {
      "name": "Kapıcı Mustafa",
      "messages": [
        {
          "mine": false,
          "text": "kargonuz geldi kapıcıya bıraktılar"
        },
        {
          "mine": true,
          "text": "sağ olun mustafa bey akşam alırım"
        },
        {
          "mine": false,
          "text": "tamam kutunun yanında duruyor"
        },
        {
          "mine": true,
          "text": "bir de su siparişi gelirse alır mısınız"
        },
        {
          "mine": false,
          "text": "alırım merak etmeyin"
        }
      ]
    },
    {
      "name": "Berber Osman",
      "messages": [
        {
          "mine": true,
          "text": "osman abi cumartesi saç için sıra var mı"
        },
        {
          "mine": false,
          "text": "sabah 11 boş isterseniz yazayım"
        },
        {
          "mine": true,
          "text": "yaz lütfen sakalı da alırız"
        },
        {
          "mine": false,
          "text": "tamam bekliyoruz"
        },
        {
          "mine": true,
          "text": "görüşürüz"
        }
      ]
    },
    {
      "name": "Kuaför Sevgi",
      "messages": [
        {
          "mine": false,
          "text": "canım fön için ne zaman gelmek istersin"
        },
        {
          "mine": true,
          "text": "cuma akşamı olur mu düğüne gidiyorum"
        },
        {
          "mine": false,
          "text": "olur 6 ya yazdım seni"
        },
        {
          "mine": true,
          "text": "topuz da yaparız değil mi"
        },
        {
          "mine": false,
          "text": "yaparız merak etme çok güzel olacak"
        },
        {
          "mine": true,
          "text": "sağ ol görüşürüz"
        }
      ]
    },
    {
      "name": "Doktor Randevu",
      "messages": [
        {
          "mine": true,
          "text": "kontrol randevumu hatırlatır mısınız ne zamandı"
        },
        {
          "mine": false,
          "text": "salı günü saat 10 30 idi"
        },
        {
          "mine": true,
          "text": "aç gelmem gerekiyor muydu"
        },
        {
          "mine": false,
          "text": "evet tahlil için sabah aç gelin"
        },
        {
          "mine": true,
          "text": "tamam teşekkürler"
        }
      ]
    },
    {
      "name": "Diş Hekimi",
      "messages": [
        {
          "mine": false,
          "text": "dolgu randevunuz yarın 3 te hatırlatmak istedik"
        },
        {
          "mine": true,
          "text": "teşekkürler geleceğim"
        },
        {
          "mine": false,
          "text": "işlem yarım saat sürer öncesinde bir şey yemeyin"
        },
        {
          "mine": true,
          "text": "tamam not aldım"
        },
        {
          "mine": false,
          "text": "görüşmek üzere"
        }
      ]
    },
    {
      "name": "Veteriner",
      "messages": [
        {
          "mine": true,
          "text": "kedimin aşı zamanı geldi mi acaba"
        },
        {
          "mine": false,
          "text": "kayıtlara göre bu ay yapılması lazım"
        },
        {
          "mine": true,
          "text": "cumartesi getirebilir miyim"
        },
        {
          "mine": false,
          "text": "getirin sabah müsaitiz"
        },
        {
          "mine": true,
          "text": "tamam taşıma kabıyla gelirim"
        }
      ]
    },
    {
      "name": "Tamirci Kadir",
      "messages": [
        {
          "mine": false,
          "text": "araba hazır fren balatalarını değiştirdik"
        },
        {
          "mine": true,
          "text": "eline sağlık ne kadar oldu"
        },
        {
          "mine": false,
          "text": "yağ da değiştik toplamı akşam söylerim hesaplayıp"
        },
        {
          "mine": true,
          "text": "tamam akşam uğrayıp alırım"
        },
        {
          "mine": false,
          "text": "olur anahtarı bende"
        }
      ]
    },
    {
      "name": "Kargo",
      "messages": [
        {
          "mine": false,
          "text": "paketiniz bugün dağıtımda evde misiniz"
        },
        {
          "mine": true,
          "text": "3 ten sonra evdeyim"
        },
        {
          "mine": false,
          "text": "tamam öğleden sonra getiririz"
        },
        {
          "mine": true,
          "text": "gelemezseniz kapıcıya bırakın lütfen"
        },
        {
          "mine": false,
          "text": "tamam not düştük"
        }
      ]
    },
    {
      "name": "Sude",
      "messages": [
        {
          "mine": true,
          "text": "sude bugün spora gidiyor musun"
        },
        {
          "mine": false,
          "text": "gidiyorum akşam 6 dersi var"
        },
        {
          "mine": true,
          "text": "beraber gidelim mi seni alayım"
        },
        {
          "mine": false,
          "text": "olur 5 45 te hazır olurum"
        },
        {
          "mine": true,
          "text": "tamam aşağıda beklerim"
        }
      ]
    },
    {
      "name": "Yasemin",
      "messages": [
        {
          "mine": false,
          "text": "yarın çocukların velisi toplantısı var haberin var mı"
        },
        {
          "mine": true,
          "text": "kaçta acaba"
        },
        {
          "mine": false,
          "text": "17 30 sınıfta"
        },
        {
          "mine": true,
          "text": "gidemem işim var sen not alır mısın"
        },
        {
          "mine": false,
          "text": "alırım sonra anlatırım"
        },
        {
          "mine": true,
          "text": "çok sağ ol"
        }
      ]
    },
    {
      "name": "Buse",
      "messages": [
        {
          "mine": true,
          "text": "buse pastane siparişini verdin mi doğum günü için"
        },
        {
          "mine": false,
          "text": "verdim çikolatalı orta boy"
        },
        {
          "mine": false,
          "text": "cumartesi 2 de hazır olacak"
        },
        {
          "mine": true,
          "text": "süper mumları da aldım ben"
        },
        {
          "mine": false,
          "text": "harika balonları da getiririm"
        }
      ]
    },
    {
      "name": "Efe",
      "messages": [
        {
          "mine": false,
          "text": "abi ödevi yaptın mı yarına"
        },
        {
          "mine": true,
          "text": "yarısını yaptım akşam bitiririm"
        },
        {
          "mine": false,
          "text": "3. soruyu anlamadım sen anladın mı"
        },
        {
          "mine": true,
          "text": "anladım akşam anlatırım telefonda"
        },
        {
          "mine": false,
          "text": "sağ ol be"
        }
      ]
    },
    {
      "name": "Arda",
      "messages": [
        {
          "mine": true,
          "text": "arda maç kaç kaç bitti kaçırdım"
        },
        {
          "mine": false,
          "text": "2 1 bizimkiler kazandı"
        },
        {
          "mine": true,
          "text": "yaa harika golleri kim attı"
        },
        {
          "mine": false,
          "text": "ikisini de santrfor attı süperdi"
        },
        {
          "mine": true,
          "text": "keşke izleseydim"
        }
      ]
    },
    {
      "name": "Damla",
      "messages": [
        {
          "mine": false,
          "text": "yeni açılan kafeyi denedik çok güzelmiş"
        },
        {
          "mine": true,
          "text": "nasıl fiyatlar"
        },
        {
          "mine": false,
          "text": "makul kahvesi de güzel"
        },
        {
          "mine": true,
          "text": "o zaman hafta sonu gidelim"
        },
        {
          "mine": false,
          "text": "olur rezervasyon yaptırayım mı"
        },
        {
          "mine": true,
          "text": "yaptır kalabalık olmasın"
        }
      ]
    },
    {
      "name": "Pınar",
      "messages": [
        {
          "mine": true,
          "text": "pınar o dizinin son bölümünü izledin mi"
        },
        {
          "mine": false,
          "text": "izledim ama spoiler vermeyeyim sana"
        },
        {
          "mine": true,
          "text": "aa ben daha izlemedim sus sus"
        },
        {
          "mine": false,
          "text": "izle de konuşalım heyecanlı"
        },
        {
          "mine": true,
          "text": "bu akşam izlerim kesin"
        }
      ]
    },
    {
      "name": "Tolga",
      "messages": [
        {
          "mine": false,
          "text": "yarın işe erken gel toplantı var demişler"
        },
        {
          "mine": true,
          "text": "kaça çekmişler"
        },
        {
          "mine": false,
          "text": "8 30 sanırım kahvaltı da var"
        },
        {
          "mine": true,
          "text": "iyi o zaman erken çıkarım evden"
        },
        {
          "mine": false,
          "text": "trafik olur dikkat et"
        }
      ]
    },
    {
      "name": "Sinem",
      "messages": [
        {
          "mine": true,
          "text": "sinem alışveriş listesine ne ekleyelim daha"
        },
        {
          "mine": false,
          "text": "peynir zeytin ve domates lazım"
        },
        {
          "mine": false,
          "text": "bir de tavuk alalım akşama"
        },
        {
          "mine": true,
          "text": "tamam tavuğu ben pişiririm"
        },
        {
          "mine": false,
          "text": "süper ben de salata yaparım"
        }
      ]
    },
    {
      "name": "Gökhan",
      "messages": [
        {
          "mine": false,
          "text": "hafta sonu balığa çıkıyoruz gelir misin"
        },
        {
          "mine": true,
          "text": "nereye gidiyorsunuz"
        },
        {
          "mine": false,
          "text": "sabah erken iskeleden"
        },
        {
          "mine": true,
          "text": "olmıcam sanırım uykum var ama sonra gelirim"
        },
        {
          "mine": false,
          "text": "tamam bir dahakine o zaman"
        }
      ]
    },
    {
      "name": "Hülya Teyze",
      "messages": [
        {
          "mine": false,
          "text": "kızım turşu kurdum sana da ayırdım"
        },
        {
          "mine": true,
          "text": "ayy çok makbule geçer teyze"
        },
        {
          "mine": false,
          "text": "geç al bir kavanoz senin için"
        },
        {
          "mine": true,
          "text": "yarın uğrarım öperim ellerinden"
        },
        {
          "mine": false,
          "text": "bekliyorum canım"
        }
      ]
    },
    {
      "name": "Nazlı",
      "messages": [
        {
          "mine": true,
          "text": "nazlı yarın yağmur varmış planı değiştirelim mi"
        },
        {
          "mine": false,
          "text": "hmm ne kadar yağarmış"
        },
        {
          "mine": true,
          "text": "öğleden sonra sağanak diyor"
        },
        {
          "mine": false,
          "text": "o zaman ev buluşması yapalım film izleriz"
        },
        {
          "mine": true,
          "text": "süper cips getiririm"
        },
        {
          "mine": false,
          "text": "ben de içecek alırım"
        }
      ]
    },
    {
      "name": "Onur",
      "messages": [
        {
          "mine": false,
          "text": "abi klima temizliği için usta lazım tanıyor musun"
        },
        {
          "mine": true,
          "text": "tanıyorum numarasını yollarım"
        },
        {
          "mine": false,
          "text": "sağ ol iyi mi hizmeti"
        },
        {
          "mine": true,
          "text": "gayet iyi geçen ben yaptırdım"
        },
        {
          "mine": false,
          "text": "süper ararım o zaman"
        }
      ]
    },
    {
      "name": "Melis",
      "messages": [
        {
          "mine": true,
          "text": "melis kızın doğum günü ne zaman unuttum"
        },
        {
          "mine": false,
          "text": "gelecek cumartesi ufak bir parti yapıyoruz"
        },
        {
          "mine": true,
          "text": "aa geliriz ne alsak hediye"
        },
        {
          "mine": false,
          "text": "boyama seti seviyor çok"
        },
        {
          "mine": true,
          "text": "tamam onu alırız o zaman"
        }
      ]
    },
    {
      "name": "Serkan",
      "messages": [
        {
          "mine": false,
          "text": "yarın servis kaçta geçiyor senin durakta"
        },
        {
          "mine": true,
          "text": "7 40 gibi geliyor genelde"
        },
        {
          "mine": false,
          "text": "tamam ben de aynı durakta bekleyeyim"
        },
        {
          "mine": true,
          "text": "olur beraber gideriz"
        },
        {
          "mine": false,
          "text": "görüşürüz sabah"
        }
      ]
    },
    {
      "name": "Betül",
      "messages": [
        {
          "mine": true,
          "text": "betül o örgü tarifini nereden bulmuştun"
        },
        {
          "mine": false,
          "text": "internetten bir videodan bekle atarım"
        },
        {
          "mine": false,
          "text": "gönderdim bak izle rahat anlatıyor"
        },
        {
          "mine": true,
          "text": "sağ ol ip almam lazım da"
        },
        {
          "mine": false,
          "text": "gri güzel durur bence"
        }
      ]
    },
    {
      "name": "Halil",
      "messages": [
        {
          "mine": false,
          "text": "abi hafta sonu boya yapıcam yardım eder misin"
        },
        {
          "mine": true,
          "text": "hangi oda"
        },
        {
          "mine": false,
          "text": "salon rulo lazım bir de"
        },
        {
          "mine": true,
          "text": "bende var getiririm cumartesi gelirim"
        },
        {
          "mine": false,
          "text": "sağ ol köfte ısmarlarım sana"
        }
      ]
    },
    {
      "name": "Aslı",
      "messages": [
        {
          "mine": true,
          "text": "aslı yarın kahvaltıya gelin bize"
        },
        {
          "mine": false,
          "text": "kaçta gelelim"
        },
        {
          "mine": true,
          "text": "10 gibi menemen yaparım"
        },
        {
          "mine": false,
          "text": "biz de poğaça getiririz o zaman"
        },
        {
          "mine": true,
          "text": "süper bekliyoruz"
        }
      ]
    },
    {
      "name": "Umut",
      "messages": [
        {
          "mine": false,
          "text": "kardeşim şarj aletini bende unutmuşsun"
        },
        {
          "mine": true,
          "text": "haa iyi ki dedin lazım oldu"
        },
        {
          "mine": false,
          "text": "yarın işte veririm"
        },
        {
          "mine": true,
          "text": "tamam sağ ol getir yeter"
        },
        {
          "mine": false,
          "text": "çantaya koydum bile"
        }
      ]
    },
    {
      "name": "Yağmur",
      "messages": [
        {
          "mine": true,
          "text": "yağmur bebeğin uyku düzeni oturdu mu"
        },
        {
          "mine": false,
          "text": "biraz düzeldi gece 3 saat uyuyor artık"
        },
        {
          "mine": true,
          "text": "oh çok iyi haber"
        },
        {
          "mine": false,
          "text": "evet biraz nefes alıyoruz"
        },
        {
          "mine": true,
          "text": "yardım lazım olursa söyle gelirim"
        }
      ]
    },
    {
      "name": "Berkay",
      "messages": [
        {
          "mine": false,
          "text": "abi oyun akşamı bu cuma toplanalım mı"
        },
        {
          "mine": true,
          "text": "kimler var"
        },
        {
          "mine": false,
          "text": "4 kişiyiz atıştırmalık alırız"
        },
        {
          "mine": true,
          "text": "olur bende masa oyunları var getiririm"
        },
        {
          "mine": false,
          "text": "süper 8 de bende"
        }
      ]
    },
    {
      "name": "İrem",
      "messages": [
        {
          "mine": true,
          "text": "irem o ayakkabıyı almışsın nasıl rahat mı"
        },
        {
          "mine": false,
          "text": "çok rahat tavsiye ederim"
        },
        {
          "mine": true,
          "text": "bedeni tam mı yoksa büyük mü alsam"
        },
        {
          "mine": false,
          "text": "tam alabilirsin bende sorun olmadı"
        },
        {
          "mine": true,
          "text": "tamam sipariş veriyorum o zaman"
        }
      ]
    },
    {
      "name": "Furkan",
      "messages": [
        {
          "mine": false,
          "text": "abi arabayla beni havalimanına bırakır mısın"
        },
        {
          "mine": true,
          "text": "uçağın kaçta"
        },
        {
          "mine": false,
          "text": "sabah 9 da 6 da çıksak olur mu"
        },
        {
          "mine": true,
          "text": "olur alarmı kurayım"
        },
        {
          "mine": false,
          "text": "çok sağ ol kahvaltı benden"
        }
      ]
    },
    {
      "name": "Selim",
      "messages": [
        {
          "mine": true,
          "text": "selim ıspanağı nasıl pişiriyordun sulu mu"
        },
        {
          "mine": false,
          "text": "soğanı kavur pirinç ekle biraz su hepsi bu"
        },
        {
          "mine": true,
          "text": "yoğurtla mı yiyorsun"
        },
        {
          "mine": false,
          "text": "sarımsaklı yoğurt şart yanında"
        },
        {
          "mine": true,
          "text": "tamam deniyorum akşam"
        }
      ]
    },
    {
      "name": "Duygu",
      "messages": [
        {
          "mine": false,
          "text": "cumartesi hastane ziyaretine gidiyoruz gelir misin"
        },
        {
          "mine": true,
          "text": "kimi ziyaret"
        },
        {
          "mine": false,
          "text": "komşumuz teyzeyi geçmiş olsuna"
        },
        {
          "mine": true,
          "text": "gelirim çiçek alalım"
        },
        {
          "mine": false,
          "text": "olur saksı çiçeği güzel olur"
        }
      ]
    },
    {
      "name": "Ege",
      "messages": [
        {
          "mine": true,
          "text": "ege futbol topunu getirir misin bugün"
        },
        {
          "mine": false,
          "text": "getiririm parka mı gidiyoruz"
        },
        {
          "mine": true,
          "text": "evet 5 gibi buluşalım"
        },
        {
          "mine": false,
          "text": "olur pompa da alayım inmiş biraz"
        },
        {
          "mine": true,
          "text": "iyi olur görüşürüz"
        }
      ]
    },
    {
      "name": "Kübra",
      "messages": [
        {
          "mine": false,
          "text": "yeni tarif denedim mercimek çorbası çok kıvamlı oldu"
        },
        {
          "mine": true,
          "text": "nasıl yaptın anlat"
        },
        {
          "mine": false,
          "text": "az un kavurdum sonra ekledim işte o yüzden"
        },
        {
          "mine": true,
          "text": "aa iyi fikir ben de deneyeyim"
        },
        {
          "mine": false,
          "text": "dene çok beğenirsin"
        }
      ]
    },
    {
      "name": "Barış",
      "messages": [
        {
          "mine": true,
          "text": "barış yarın sabah koşuya var mısın"
        },
        {
          "mine": false,
          "text": "kaçta"
        },
        {
          "mine": true,
          "text": "7 de parkta buluşalım"
        },
        {
          "mine": false,
          "text": "olur ama 3 tur yeter bana"
        },
        {
          "mine": true,
          "text": "tamam ağırdan alırız"
        }
      ]
    },
    {
      "name": "Öğretmen Ayça",
      "messages": [
        {
          "mine": false,
          "text": "merhaba yarın kermes için kek getirebilir misiniz"
        },
        {
          "mine": true,
          "text": "tabii getiririm kaç tane olsun"
        },
        {
          "mine": false,
          "text": "bir tepsi yeter çok teşekkürler"
        },
        {
          "mine": true,
          "text": "rica ederim sabah bırakırım"
        },
        {
          "mine": false,
          "text": "elinize sağlık şimdiden"
        }
      ]
    },
    {
      "name": "Sınıf Grubu",
      "messages": [
        {
          "mine": false,
          "text": "arkadaşlar yarın beden dersi için eşofman lazımmış"
        },
        {
          "mine": true,
          "text": "hatırlatma için sağ ol unutuyordum"
        },
        {
          "mine": false,
          "text": "bir de su şişesi getirsinler dediler"
        },
        {
          "mine": true,
          "text": "tamam çantaya koydum"
        },
        {
          "mine": false,
          "text": "harika görüşürüz"
        }
      ]
    },
    {
      "name": "Muhasebeci Fikret",
      "messages": [
        {
          "mine": true,
          "text": "fikret bey belgeleri ne zaman getireyim"
        },
        {
          "mine": false,
          "text": "bu hafta içi uygun olduğunuzda"
        },
        {
          "mine": true,
          "text": "perşembe öğlen uğrayabilirim"
        },
        {
          "mine": false,
          "text": "olur ofisteyim bekliyorum"
        },
        {
          "mine": true,
          "text": "teşekkürler görüşürüz"
        }
      ]
    },
    {
      "name": "Terzi Ayten",
      "messages": [
        {
          "mine": false,
          "text": "pantolonun paçası hazır alabilirsiniz"
        },
        {
          "mine": true,
          "text": "sağ olun ne kadar oldu"
        },
        {
          "mine": false,
          "text": "çok değil gelince söylerim"
        },
        {
          "mine": true,
          "text": "tamam yarın uğrarım"
        },
        {
          "mine": false,
          "text": "bekliyorum kolay gelsin"
        }
      ]
    },
    {
      "name": "Manav Rıza",
      "messages": [
        {
          "mine": true,
          "text": "rıza abi domates taze mi bugün"
        },
        {
          "mine": false,
          "text": "sabah geldi taptaze"
        },
        {
          "mine": true,
          "text": "2 kilo ayırır mısın uğrayacağım"
        },
        {
          "mine": false,
          "text": "ayırdım güzellerinden seçtim"
        },
        {
          "mine": true,
          "text": "sağ ol yarım saate oradayım"
        }
      ]
    },
    {
      "name": "Fırıncı Yusuf",
      "messages": [
        {
          "mine": false,
          "text": "poğaçalar fırından yeni çıktı sıcak sıcak"
        },
        {
          "mine": true,
          "text": "5 tane ayırır mısın geliyorum"
        },
        {
          "mine": false,
          "text": "ayırdım peynirli mi patatesli mi"
        },
        {
          "mine": true,
          "text": "karışık olsun"
        },
        {
          "mine": false,
          "text": "tamam hazır bekliyor"
        }
      ]
    },
    {
      "name": "Bakkal Ali",
      "messages": [
        {
          "mine": true,
          "text": "ali abi ekmek kaldı mı akşama"
        },
        {
          "mine": false,
          "text": "birkaç tane var koşarsan yetişir"
        },
        {
          "mine": true,
          "text": "2 tane ayır geliyorum"
        },
        {
          "mine": false,
          "text": "ayırdım bir de gazete ister misin"
        },
        {
          "mine": true,
          "text": "yok sağ ol sadece ekmek"
        }
      ]
    },
    {
      "name": "Ev Sahibi",
      "messages": [
        {
          "mine": false,
          "text": "merhaba bu ayki kira için hatırlatmak istedim"
        },
        {
          "mine": true,
          "text": "tabii yarın yatırırım"
        },
        {
          "mine": false,
          "text": "teşekkürler bir de kombi bakımı yaptırdınız mı"
        },
        {
          "mine": true,
          "text": "gelecek hafta usta gelecek ayarladım"
        },
        {
          "mine": false,
          "text": "harika kolay gelsin"
        }
      ]
    },
    {
      "name": "Yeni Komşu",
      "messages": [
        {
          "mine": true,
          "text": "merhaba hoş geldiniz aparta yeni mi taşındınız"
        },
        {
          "mine": false,
          "text": "evet dün taşındık teşekkür ederiz"
        },
        {
          "mine": true,
          "text": "bir ihtiyacınız olursa çekinmeyin"
        },
        {
          "mine": false,
          "text": "çok naziksiniz sağ olun"
        },
        {
          "mine": true,
          "text": "kolay gelsin yerleşmeniz"
        }
      ]
    },
    {
      "name": "Spor Salonu",
      "messages": [
        {
          "mine": false,
          "text": "üyeliğiniz bu ay yenilenecek hatırlatmak istedik"
        },
        {
          "mine": true,
          "text": "teşekkürler bu hafta uğrarım"
        },
        {
          "mine": false,
          "text": "yeni grup dersleri de başladı bilginize"
        },
        {
          "mine": true,
          "text": "hangi günler acaba"
        },
        {
          "mine": false,
          "text": "salı ve perşembe akşam"
        }
      ]
    },
    {
      "name": "İş Grubu",
      "messages": [
        {
          "mine": false,
          "text": "arkadaşlar yarın öğle yemeği siparişini toplayalım"
        },
        {
          "mine": true,
          "text": "ben mercimek çorbası ve tavuk alayım"
        },
        {
          "mine": false,
          "text": "not aldım başka isteyen"
        },
        {
          "mine": true,
          "text": "bir de ayran olsun benimki"
        },
        {
          "mine": false,
          "text": "tamam ekledim"
        }
      ]
    },
    {
      "name": "Ekin",
      "messages": [
        {
          "mine": true,
          "text": "ekin bu hafta sonu ev temizliğine yardım eder misin"
        },
        {
          "mine": false,
          "text": "ederim cumartesi sabah gelirim"
        },
        {
          "mine": true,
          "text": "süper camları beraber yaparız"
        },
        {
          "mine": false,
          "text": "olur ben eldiven getiririm"
        },
        {
          "mine": true,
          "text": "sağ ol kahvaltı hazır olur"
        }
      ]
    },
    {
      "name": "Tuğçe",
      "messages": [
        {
          "mine": false,
          "text": "yarın çocuğu kreşten sen mi alıyorsun ben mi"
        },
        {
          "mine": true,
          "text": "ben alırım işim erken bitiyor"
        },
        {
          "mine": false,
          "text": "tamam ben markete uğrarım o zaman"
        },
        {
          "mine": true,
          "text": "süt de al bu arada bitti"
        },
        {
          "mine": false,
          "text": "not aldım"
        }
      ]
    },
    {
      "name": "Volkan",
      "messages": [
        {
          "mine": true,
          "text": "volkan hafta sonu taşınmaya kamyonet lazım tanıdığın var mı"
        },
        {
          "mine": false,
          "text": "var numara vereyim uygun fiyat yapar"
        },
        {
          "mine": true,
          "text": "sağ ol ne zaman aramalıyım"
        },
        {
          "mine": false,
          "text": "akşam ara müsait olur"
        },
        {
          "mine": true,
          "text": "tamam eyvallah"
        }
      ]
    },
    {
      "name": "Sıla",
      "messages": [
        {
          "mine": false,
          "text": "yeni tarif çilekli kek yaptım çok güzel oldu"
        },
        {
          "mine": true,
          "text": "ay canım çok isterim tarifi at"
        },
        {
          "mine": false,
          "text": "atarım basit aslında"
        },
        {
          "mine": true,
          "text": "sen de biraz getir tadına bakayım"
        },
        {
          "mine": false,
          "text": "yarın uğrarken getiririm"
        }
      ]
    },
    {
      "name": "Kerem",
      "messages": [
        {
          "mine": true,
          "text": "kerem yarın sabah beni işe bırakır mısın araba serviste"
        },
        {
          "mine": false,
          "text": "bırakırım 8 de hazır ol"
        },
        {
          "mine": true,
          "text": "tamam aşağıda beklerim"
        },
        {
          "mine": false,
          "text": "kahve alırım yolda ikimize"
        },
        {
          "mine": true,
          "text": "harikasın sağ ol"
        }
      ]
    },
    {
      "name": "Beren",
      "messages": [
        {
          "mine": false,
          "text": "kızım okul formasını ütüledin mi yarına"
        },
        {
          "mine": true,
          "text": "ütüledim asılı dolapta"
        },
        {
          "mine": false,
          "text": "aferin çantasını da hazırla"
        },
        {
          "mine": true,
          "text": "hazır kitaplar içinde"
        },
        {
          "mine": false,
          "text": "eline sağlık"
        }
      ]
    },
    {
      "name": "Mert",
      "messages": [
        {
          "mine": true,
          "text": "mert akşam maça gidiyor muyuz bilet aldın mı"
        },
        {
          "mine": false,
          "text": "aldım iki tane tribün"
        },
        {
          "mine": true,
          "text": "süper nerede buluşalım"
        },
        {
          "mine": false,
          "text": "stat girişinde 7 de"
        },
        {
          "mine": true,
          "text": "tamam atkıyı unutma"
        }
      ]
    },
    {
      "name": "Gamze",
      "messages": [
        {
          "mine": false,
          "text": "perşembe manikür randevusu var beraber gidelim mi"
        },
        {
          "mine": true,
          "text": "kaçta"
        },
        {
          "mine": false,
          "text": "4 te salonda"
        },
        {
          "mine": true,
          "text": "olur ben de kaşları aldırayım"
        },
        {
          "mine": false,
          "text": "süper ikimize de yazdırdım"
        },
        {
          "mine": true,
          "text": "sağ ol görüşürüz"
        }
      ]
    },
    {
      "name": "Uğur",
      "messages": [
        {
          "mine": true,
          "text": "uğur bahçedeki çimleri biçtin mi bu hafta"
        },
        {
          "mine": false,
          "text": "biçtim ama makine takıldı biraz"
        },
        {
          "mine": true,
          "text": "yağını kontrol et belki ondan"
        },
        {
          "mine": false,
          "text": "bakarım hafta sonu"
        },
        {
          "mine": true,
          "text": "sağ ol kolay gelsin"
        }
      ]
    },
    {
      "name": "Nehir",
      "messages": [
        {
          "mine": false,
          "text": "yarın piknik iptal mi hava kapalı gibi"
        },
        {
          "mine": true,
          "text": "öğlene kadar açar diyorlar bekleyelim"
        },
        {
          "mine": false,
          "text": "tamam sabah tekrar bakarız"
        },
        {
          "mine": true,
          "text": "olur sepeti yine de hazırlarım"
        },
        {
          "mine": false,
          "text": "iyi olur ben de battaniye getiririm"
        }
      ]
    },
    {
      "name": "Aylin",
      "messages": [
        {
          "mine": true,
          "text": "aylin o kitabı bitirince bana verir misin"
        },
        {
          "mine": false,
          "text": "tabii birkaç güne biter"
        },
        {
          "mine": true,
          "text": "acele yok ben de sana romanı vereyim"
        },
        {
          "mine": false,
          "text": "harika değişim yaparız"
        },
        {
          "mine": true,
          "text": "olur hafta sonu buluşalım"
        }
      ]
    },
    {
      "name": "Toprak",
      "messages": [
        {
          "mine": false,
          "text": "abi köpeği bugün gezdirdin mi ben geç kaldım"
        },
        {
          "mine": true,
          "text": "gezdirdim parka gittik biraz koştu"
        },
        {
          "mine": false,
          "text": "oh sağ ol mamasını verdin mi"
        },
        {
          "mine": true,
          "text": "verdim suyunu da tazeledim"
        },
        {
          "mine": false,
          "text": "harikasın akşam görüşürüz"
        }
      ]
    },
    {
      "name": "Defne",
      "messages": [
        {
          "mine": true,
          "text": "defne yarın doğum günü hediyesini beraber alalım mı"
        },
        {
          "mine": false,
          "text": "olur nereden bakalım"
        },
        {
          "mine": true,
          "text": "çarşıdaki hediyelik dükkanı iyiydi"
        },
        {
          "mine": false,
          "text": "tamam 5 te orada buluşalım"
        },
        {
          "mine": true,
          "text": "süper görüşürüz"
        }
      ]
    },
    {
      "name": "Bora",
      "messages": [
        {
          "mine": false,
          "text": "kardeşim bilgisayar yine yavaşladı bir bakar mısın"
        },
        {
          "mine": true,
          "text": "bakarım hafta içi uğrarım"
        },
        {
          "mine": false,
          "text": "sağ ol ne zaman uygunsan"
        },
        {
          "mine": true,
          "text": "çarşamba akşam olur"
        },
        {
          "mine": false,
          "text": "tamam bekliyorum"
        }
      ]
    },
    {
      "name": "Ela",
      "messages": [
        {
          "mine": true,
          "text": "ela çocuklar için parkta buluşalım mı yarın"
        },
        {
          "mine": false,
          "text": "olur hangi park"
        },
        {
          "mine": true,
          "text": "mahalledeki yeni oyun alanı"
        },
        {
          "mine": false,
          "text": "süper 11 de gelirim"
        },
        {
          "mine": true,
          "text": "biz de meyve getiririz"
        }
      ]
    },
    {
      "name": "Cenk",
      "messages": [
        {
          "mine": false,
          "text": "abi düğün için takım elbise baktın mı"
        },
        {
          "mine": true,
          "text": "bakıyorum ama karar veremedim lacivert mi gri mi"
        },
        {
          "mine": false,
          "text": "lacivert her yere gider bence"
        },
        {
          "mine": true,
          "text": "haklısın onu alayım o zaman"
        },
        {
          "mine": false,
          "text": "iyi seçim beraber gidelim istersen"
        },
        {
          "mine": true,
          "text": "olur cumartesi çıkalım"
        }
      ]
    },
    {
      "name": "Zehra",
      "messages": [
        {
          "mine": true,
          "text": "zehra o dikiş makinesini birkaç gün ödünç alabilir miyim"
        },
        {
          "mine": false,
          "text": "tabii al perde dikecektim ama bekleyebilir"
        },
        {
          "mine": true,
          "text": "yok o zaman senden sonra alırım"
        },
        {
          "mine": false,
          "text": "yok yok sen al ben sonra yaparım"
        },
        {
          "mine": true,
          "text": "sağ ol çok makbule geçti"
        }
      ]
    },
    {
      "name": "Yunus",
      "messages": [
        {
          "mine": false,
          "text": "abi hafta sonu araba yıkamaya gidelim mi beraber"
        },
        {
          "mine": true,
          "text": "gidelim benimki de kir içinde"
        },
        {
          "mine": false,
          "text": "sabah erken gidersek sıra olmaz"
        },
        {
          "mine": true,
          "text": "tamam 9 da geçerim seni alırım"
        },
        {
          "mine": false,
          "text": "süper hazır olurum"
        }
      ]
    },
    {
      "name": "Meltem",
      "messages": [
        {
          "mine": true,
          "text": "meltem akşam yemeğe ne yapsam fikir ver"
        },
        {
          "mine": false,
          "text": "makarna yap kolay hem herkes sever"
        },
        {
          "mine": true,
          "text": "sos olarak ne önerirsin"
        },
        {
          "mine": false,
          "text": "domatesli yap üstüne peynir rendele"
        },
        {
          "mine": true,
          "text": "iyi fikir öyle yapayım"
        },
        {
          "mine": false,
          "text": "afiyet olsun şimdiden"
        }
      ]
    }
  ],
  "zh": [
    {
      "name": "妈妈",
      "messages": [
        {
          "mine": false,
          "text": "晚上回来吃饭吗？我炖了排骨"
        },
        {
          "mine": true,
          "text": "回啊，几点开饭"
        },
        {
          "mine": false,
          "text": "六点半差不多，你别又加班到八点"
        },
        {
          "mine": true,
          "text": "今天不加班，早点回"
        },
        {
          "mine": false,
          "text": "路上买两根玉米回来"
        },
        {
          "mine": true,
          "text": "好嘞"
        }
      ]
    },
    {
      "name": "爸爸",
      "messages": [
        {
          "mine": true,
          "text": "爸，家里的热水器又不出热水了"
        },
        {
          "mine": false,
          "text": "是不是没电了，看看闸"
        },
        {
          "mine": true,
          "text": "闸是好的，就是烧不热"
        },
        {
          "mine": false,
          "text": "那估计要换个加热棒，我明天过去看看"
        },
        {
          "mine": true,
          "text": "行，你别自己爬高，让我来"
        },
        {
          "mine": false,
          "text": "知道了知道了"
        }
      ]
    },
    {
      "name": "奶奶",
      "messages": [
        {
          "mine": false,
          "text": "乖孙，吃饭了没"
        },
        {
          "mine": true,
          "text": "吃了奶奶，你呢"
        },
        {
          "mine": false,
          "text": "我也吃了，喝了碗小米粥"
        },
        {
          "mine": true,
          "text": "天冷了多穿点，别省电不开暖气"
        },
        {
          "mine": false,
          "text": "开着呢，你放心"
        },
        {
          "mine": true,
          "text": "周末我回去看你"
        },
        {
          "mine": false,
          "text": "好好好，给你留你爱吃的枣糕"
        }
      ]
    },
    {
      "name": "爷爷",
      "messages": [
        {
          "mine": true,
          "text": "爷爷，血压最近还好吗"
        },
        {
          "mine": false,
          "text": "挺稳的，药按时吃着呢"
        },
        {
          "mine": true,
          "text": "那就好，天冷别一大早出去遛弯"
        },
        {
          "mine": false,
          "text": "等太阳出来才去，不着急"
        },
        {
          "mine": true,
          "text": "周日陪你下棋"
        },
        {
          "mine": false,
          "text": "行，我等着杀你个片甲不留"
        }
      ]
    },
    {
      "name": "外婆",
      "messages": [
        {
          "mine": false,
          "text": "腌了一坛子萝卜干，给你留着"
        },
        {
          "mine": true,
          "text": "太好了，我最爱吃你腌的"
        },
        {
          "mine": false,
          "text": "什么时候来拿"
        },
        {
          "mine": true,
          "text": "这周六过去，顺便帮你搬花盆"
        },
        {
          "mine": false,
          "text": "那几盆太重了，正好"
        },
        {
          "mine": true,
          "text": "记得别自己搬啊"
        }
      ]
    },
    {
      "name": "外公",
      "messages": [
        {
          "mine": true,
          "text": "外公，收音机修好了吗"
        },
        {
          "mine": false,
          "text": "修好了，换了个电池就行"
        },
        {
          "mine": true,
          "text": "那就好，别老自己拆"
        },
        {
          "mine": false,
          "text": "小毛病我还能对付"
        },
        {
          "mine": true,
          "text": "下次不会我帮你弄"
        }
      ]
    },
    {
      "name": "老婆",
      "messages": [
        {
          "mine": false,
          "text": "下班顺路取一下快递，柜子里两个"
        },
        {
          "mine": true,
          "text": "好，取件码发我"
        },
        {
          "mine": false,
          "text": "发你微信了"
        },
        {
          "mine": true,
          "text": "晚饭想吃啥"
        },
        {
          "mine": false,
          "text": "随便，你想吃啥都行"
        },
        {
          "mine": true,
          "text": "那煮个面加个蛋"
        },
        {
          "mine": false,
          "text": "行，多放青菜"
        }
      ]
    },
    {
      "name": "老公",
      "messages": [
        {
          "mine": true,
          "text": "娃的钢琴课改到周三了"
        },
        {
          "mine": false,
          "text": "哦好，那周三我去接"
        },
        {
          "mine": true,
          "text": "谢啦，我那天有会走不开"
        },
        {
          "mine": false,
          "text": "没事，几点"
        },
        {
          "mine": true,
          "text": "五点半下课"
        },
        {
          "mine": false,
          "text": "记下了"
        }
      ]
    },
    {
      "name": "大姐",
      "messages": [
        {
          "mine": false,
          "text": "妈生日那天你几点到"
        },
        {
          "mine": true,
          "text": "我下午三点左右，堵车就晚点"
        },
        {
          "mine": false,
          "text": "蛋糕我订了，你带点水果"
        },
        {
          "mine": true,
          "text": "好，买点车厘子和橙子"
        },
        {
          "mine": false,
          "text": "别买太多吃不完"
        },
        {
          "mine": true,
          "text": "行，适量"
        }
      ]
    },
    {
      "name": "二哥",
      "messages": [
        {
          "mine": true,
          "text": "哥，上次借你的电钻还我一下呗"
        },
        {
          "mine": false,
          "text": "在我车里，明天给你带过去"
        },
        {
          "mine": true,
          "text": "不急，你顺路就行"
        },
        {
          "mine": false,
          "text": "正好周四去你那边"
        },
        {
          "mine": true,
          "text": "那太好了"
        }
      ]
    },
    {
      "name": "小妹",
      "messages": [
        {
          "mine": false,
          "text": "姐我周末去你家蹭饭行不"
        },
        {
          "mine": true,
          "text": "来呗，正好包饺子"
        },
        {
          "mine": false,
          "text": "太好了，我带瓶饮料"
        },
        {
          "mine": true,
          "text": "带你上次说的那个酸奶"
        },
        {
          "mine": false,
          "text": "没问题"
        },
        {
          "mine": true,
          "text": "几点到"
        },
        {
          "mine": false,
          "text": "中午之前吧"
        }
      ]
    },
    {
      "name": "表哥",
      "messages": [
        {
          "mine": true,
          "text": "表哥，你家那款扫地机好用吗"
        },
        {
          "mine": false,
          "text": "还行，边角扫不太干净"
        },
        {
          "mine": true,
          "text": "那我再考虑考虑"
        },
        {
          "mine": false,
          "text": "要买趁着有活动"
        },
        {
          "mine": true,
          "text": "嗯，我看看"
        }
      ]
    },
    {
      "name": "表妹",
      "messages": [
        {
          "mine": false,
          "text": "哥，帮我看看这个数学题呗"
        },
        {
          "mine": true,
          "text": "拍照发我"
        },
        {
          "mine": false,
          "text": "发了"
        },
        {
          "mine": true,
          "text": "这题先通分，你再算算"
        },
        {
          "mine": false,
          "text": "哦懂了懂了谢谢哥"
        }
      ]
    },
    {
      "name": "堂弟",
      "messages": [
        {
          "mine": true,
          "text": "过年回老家不"
        },
        {
          "mine": false,
          "text": "回啊，你们几号"
        },
        {
          "mine": true,
          "text": "腊月二十八到"
        },
        {
          "mine": false,
          "text": "那正好一起，我二十七"
        },
        {
          "mine": true,
          "text": "到时候一起打牌"
        },
        {
          "mine": false,
          "text": "必须的"
        }
      ]
    },
    {
      "name": "舅舅",
      "messages": [
        {
          "mine": false,
          "text": "你妈让我问你冰箱选好了没"
        },
        {
          "mine": true,
          "text": "选好了，就等下周送货"
        },
        {
          "mine": false,
          "text": "行，到时候搬进屋叫我"
        },
        {
          "mine": true,
          "text": "不用不用，有师傅送上门"
        },
        {
          "mine": false,
          "text": "那也行"
        }
      ]
    },
    {
      "name": "姑姑",
      "messages": [
        {
          "mine": true,
          "text": "姑姑，你织的围巾我戴上啦，好暖"
        },
        {
          "mine": false,
          "text": "合适就好，颜色我怕太素"
        },
        {
          "mine": true,
          "text": "不素不素，正好"
        },
        {
          "mine": false,
          "text": "喜欢我再给你织个手套"
        },
        {
          "mine": true,
          "text": "哈哈那太麻烦你了"
        },
        {
          "mine": false,
          "text": "不麻烦，闲着也是闲着"
        }
      ]
    },
    {
      "name": "阿姨",
      "messages": [
        {
          "mine": false,
          "text": "明天来打扫吗"
        },
        {
          "mine": true,
          "text": "来的，上午九点方便吗"
        },
        {
          "mine": false,
          "text": "方便，我把钥匙放门口花盆下"
        },
        {
          "mine": true,
          "text": "好嘞，厨房我重点擦一下"
        },
        {
          "mine": false,
          "text": "麻烦你了"
        }
      ]
    },
    {
      "name": "小舅妈",
      "messages": [
        {
          "mine": true,
          "text": "舅妈那个红烧肉怎么做的"
        },
        {
          "mine": false,
          "text": "先焯水，再炒糖色"
        },
        {
          "mine": false,
          "text": "小火慢炖四十分钟"
        },
        {
          "mine": true,
          "text": "糖色老炒糊，有啥诀窍"
        },
        {
          "mine": false,
          "text": "小火，冒小泡就下肉"
        },
        {
          "mine": true,
          "text": "懂了，我今晚试试"
        }
      ]
    },
    {
      "name": "张伟",
      "messages": [
        {
          "mine": false,
          "text": "周末踢球不"
        },
        {
          "mine": true,
          "text": "踢啊，老地方几点"
        },
        {
          "mine": false,
          "text": "下午三点"
        },
        {
          "mine": true,
          "text": "行，我带个球"
        },
        {
          "mine": false,
          "text": "好，人差不多够了"
        }
      ]
    },
    {
      "name": "李梅",
      "messages": [
        {
          "mine": true,
          "text": "你那本书看完了吗，想借"
        },
        {
          "mine": false,
          "text": "看完了，明天带给你"
        },
        {
          "mine": true,
          "text": "谢啦"
        },
        {
          "mine": false,
          "text": "结局有点仓促，你看看"
        },
        {
          "mine": true,
          "text": "哈哈好，看完跟你聊"
        }
      ]
    },
    {
      "name": "王芳",
      "messages": [
        {
          "mine": false,
          "text": "闺蜜下周约个饭呗"
        },
        {
          "mine": true,
          "text": "好啊，周几"
        },
        {
          "mine": false,
          "text": "周五晚上行不"
        },
        {
          "mine": true,
          "text": "行，吃火锅吧"
        },
        {
          "mine": false,
          "text": "可以，我订个位"
        },
        {
          "mine": true,
          "text": "订好发我"
        }
      ]
    },
    {
      "name": "刘勇",
      "messages": [
        {
          "mine": true,
          "text": "哥们你家网速多少啊"
        },
        {
          "mine": false,
          "text": "两百兆，够用"
        },
        {
          "mine": true,
          "text": "我这经常卡，想换"
        },
        {
          "mine": false,
          "text": "打客服问问，有时候能免费提速"
        },
        {
          "mine": true,
          "text": "行，我试试"
        }
      ]
    },
    {
      "name": "陈静",
      "messages": [
        {
          "mine": false,
          "text": "明天一起去菜市场不"
        },
        {
          "mine": true,
          "text": "去啊，几点"
        },
        {
          "mine": false,
          "text": "早上八点，趁新鲜"
        },
        {
          "mine": true,
          "text": "好，我买点排骨"
        },
        {
          "mine": false,
          "text": "我买鱼，晚了就没了"
        },
        {
          "mine": true,
          "text": "那早点走"
        }
      ]
    },
    {
      "name": "赵磊",
      "messages": [
        {
          "mine": true,
          "text": "你那台旧显示器还要不"
        },
        {
          "mine": false,
          "text": "不要了，你拿去用吧"
        },
        {
          "mine": true,
          "text": "那太好了，谢谢"
        },
        {
          "mine": false,
          "text": "线也一起给你"
        },
        {
          "mine": true,
          "text": "改天请你吃饭"
        },
        {
          "mine": false,
          "text": "客气啥"
        }
      ]
    },
    {
      "name": "孙媛",
      "messages": [
        {
          "mine": false,
          "text": "娃们放学一起接呗，我今天有事"
        },
        {
          "mine": true,
          "text": "行，我顺路帮你接"
        },
        {
          "mine": false,
          "text": "太谢谢了，四点校门口"
        },
        {
          "mine": true,
          "text": "好，接到给你发消息"
        },
        {
          "mine": false,
          "text": "麻烦你了"
        }
      ]
    },
    {
      "name": "周强",
      "messages": [
        {
          "mine": true,
          "text": "明天羽毛球场订到了没"
        },
        {
          "mine": false,
          "text": "订到了，晚上七点两号场"
        },
        {
          "mine": true,
          "text": "好，我带瓶水"
        },
        {
          "mine": false,
          "text": "再叫俩人凑双打"
        },
        {
          "mine": true,
          "text": "我问问看"
        }
      ]
    },
    {
      "name": "吴敏",
      "messages": [
        {
          "mine": false,
          "text": "你上次说的那家理发店叫啥"
        },
        {
          "mine": true,
          "text": "就商场三楼那家"
        },
        {
          "mine": false,
          "text": "贵不贵"
        },
        {
          "mine": true,
          "text": "还行，剪加洗一百出头"
        },
        {
          "mine": false,
          "text": "行，我去试试"
        }
      ]
    },
    {
      "name": "郑晓",
      "messages": [
        {
          "mine": true,
          "text": "周末有空帮我搬个家不"
        },
        {
          "mine": false,
          "text": "行啊，东西多吗"
        },
        {
          "mine": true,
          "text": "不多，主要是几个箱子和一张桌子"
        },
        {
          "mine": false,
          "text": "那没问题，叫上小刚"
        },
        {
          "mine": true,
          "text": "好，我请你们吃饭"
        },
        {
          "mine": false,
          "text": "成交"
        }
      ]
    },
    {
      "name": "小美",
      "messages": [
        {
          "mine": false,
          "text": "你家猫还领养不，我这有只小的"
        },
        {
          "mine": true,
          "text": "哎哟我家一只就够呛了"
        },
        {
          "mine": false,
          "text": "太可爱了你看看照片"
        },
        {
          "mine": true,
          "text": "是挺可爱，我帮你问问朋友"
        },
        {
          "mine": false,
          "text": "太好了，急着找人家"
        },
        {
          "mine": true,
          "text": "我发朋友圈问问"
        }
      ]
    },
    {
      "name": "小刚",
      "messages": [
        {
          "mine": true,
          "text": "哥们借我个行李箱呗"
        },
        {
          "mine": false,
          "text": "大的小的"
        },
        {
          "mine": true,
          "text": "大的，出差一周"
        },
        {
          "mine": false,
          "text": "行，明天拿给你"
        },
        {
          "mine": true,
          "text": "谢啦，用完就还"
        },
        {
          "mine": false,
          "text": "不急"
        }
      ]
    },
    {
      "name": "阿强",
      "messages": [
        {
          "mine": false,
          "text": "晚上打球吗"
        },
        {
          "mine": true,
          "text": "今天不行，加班"
        },
        {
          "mine": false,
          "text": "行，那改天"
        },
        {
          "mine": true,
          "text": "周三肯定去"
        },
        {
          "mine": false,
          "text": "好，等你"
        }
      ]
    },
    {
      "name": "阿珍",
      "messages": [
        {
          "mine": true,
          "text": "你家娃报的那个画画班怎么样"
        },
        {
          "mine": false,
          "text": "挺好的，老师有耐心"
        },
        {
          "mine": true,
          "text": "多少钱一节"
        },
        {
          "mine": false,
          "text": "算下来一节八十"
        },
        {
          "mine": true,
          "text": "还行，我带娃去体验下"
        },
        {
          "mine": false,
          "text": "报我名字有优惠"
        }
      ]
    },
    {
      "name": "老王",
      "messages": [
        {
          "mine": false,
          "text": "你家门口那堆纸箱收了啊"
        },
        {
          "mine": true,
          "text": "哦忘了，这就下去收"
        },
        {
          "mine": false,
          "text": "别放太久，占地方"
        },
        {
          "mine": true,
          "text": "马上马上，不好意思"
        },
        {
          "mine": false,
          "text": "没事，提醒一下"
        }
      ]
    },
    {
      "name": "老李",
      "messages": [
        {
          "mine": true,
          "text": "老李，明早拼车不"
        },
        {
          "mine": false,
          "text": "拼，几点走"
        },
        {
          "mine": true,
          "text": "七点二十楼下"
        },
        {
          "mine": false,
          "text": "行，我准时下去"
        },
        {
          "mine": true,
          "text": "油费还是老规矩AA"
        },
        {
          "mine": false,
          "text": "没问题"
        }
      ]
    },
    {
      "name": "老张",
      "messages": [
        {
          "mine": false,
          "text": "钓鱼去不，明天"
        },
        {
          "mine": true,
          "text": "去啊，老地方"
        },
        {
          "mine": false,
          "text": "对，早上五点半集合"
        },
        {
          "mine": true,
          "text": "这么早，行吧"
        },
        {
          "mine": false,
          "text": "早点鱼口好"
        },
        {
          "mine": true,
          "text": "我带蚯蚓"
        }
      ]
    },
    {
      "name": "胖子",
      "messages": [
        {
          "mine": true,
          "text": "减肥大业进行到哪了"
        },
        {
          "mine": false,
          "text": "别提了，昨晚又吃了顿烧烤"
        },
        {
          "mine": true,
          "text": "哈哈哈没救了"
        },
        {
          "mine": false,
          "text": "明天开始，一定"
        },
        {
          "mine": true,
          "text": "你这话说一年了"
        },
        {
          "mine": false,
          "text": "这次真的"
        }
      ]
    },
    {
      "name": "眼镜",
      "messages": [
        {
          "mine": false,
          "text": "你那副旧眼镜框还留着不"
        },
        {
          "mine": true,
          "text": "留着呢，怎么"
        },
        {
          "mine": false,
          "text": "想看看款式，我要配新的"
        },
        {
          "mine": true,
          "text": "明天带给你参考"
        },
        {
          "mine": false,
          "text": "谢啦"
        }
      ]
    },
    {
      "name": "大壮",
      "messages": [
        {
          "mine": true,
          "text": "搬新家暖房不叫我"
        },
        {
          "mine": false,
          "text": "叫叫叫，就等你"
        },
        {
          "mine": true,
          "text": "哈哈啥时候"
        },
        {
          "mine": false,
          "text": "这周六晚上"
        },
        {
          "mine": true,
          "text": "行，我带酒"
        },
        {
          "mine": false,
          "text": "来就行，别带东西"
        }
      ]
    },
    {
      "name": "楼下快递",
      "messages": [
        {
          "mine": false,
          "text": "您有个包裹到了，放柜子里了"
        },
        {
          "mine": true,
          "text": "好的，谢谢，取件码有吗"
        },
        {
          "mine": false,
          "text": "短信发您了"
        },
        {
          "mine": true,
          "text": "收到，晚点去取"
        },
        {
          "mine": false,
          "text": "柜子24小时开着，不急"
        }
      ]
    },
    {
      "name": "水管工老王",
      "messages": [
        {
          "mine": true,
          "text": "王师傅，厨房下水管漏水"
        },
        {
          "mine": false,
          "text": "漏得厉害吗"
        },
        {
          "mine": true,
          "text": "滴滴答答的，接了个盆"
        },
        {
          "mine": false,
          "text": "我下午三点过去，你在家不"
        },
        {
          "mine": true,
          "text": "在，麻烦你了"
        },
        {
          "mine": false,
          "text": "换个密封圈就好，不贵"
        }
      ]
    },
    {
      "name": "电工师傅",
      "messages": [
        {
          "mine": false,
          "text": "您家客厅那个灯我看了，是镇流器坏了"
        },
        {
          "mine": true,
          "text": "换一个多少钱"
        },
        {
          "mine": false,
          "text": "带工三十"
        },
        {
          "mine": true,
          "text": "行，换吧"
        },
        {
          "mine": false,
          "text": "我这就装上"
        },
        {
          "mine": true,
          "text": "谢谢师傅"
        }
      ]
    },
    {
      "name": "房东李姐",
      "messages": [
        {
          "mine": true,
          "text": "李姐，卫生间的花洒坏了"
        },
        {
          "mine": false,
          "text": "好的，我叫师傅去看看"
        },
        {
          "mine": true,
          "text": "麻烦您了"
        },
        {
          "mine": false,
          "text": "这两天房租我收到了，谢谢"
        },
        {
          "mine": true,
          "text": "嗯，准时交的"
        },
        {
          "mine": false,
          "text": "有事随时说"
        }
      ]
    },
    {
      "name": "中介小周",
      "messages": [
        {
          "mine": false,
          "text": "哥，那套两居室房东同意周末看房"
        },
        {
          "mine": true,
          "text": "周六上午行吗"
        },
        {
          "mine": false,
          "text": "行，我约十点"
        },
        {
          "mine": true,
          "text": "好，采光怎么样"
        },
        {
          "mine": false,
          "text": "南向，挺亮的，你去看就知道"
        },
        {
          "mine": true,
          "text": "行，周六见"
        }
      ]
    },
    {
      "name": "修车老赵",
      "messages": [
        {
          "mine": true,
          "text": "赵师傅，我这车换机油得多久"
        },
        {
          "mine": false,
          "text": "半小时就好，你来吧"
        },
        {
          "mine": true,
          "text": "顺便看看刹车片"
        },
        {
          "mine": false,
          "text": "行，一起给你查了"
        },
        {
          "mine": true,
          "text": "我这就过去"
        },
        {
          "mine": false,
          "text": "路上慢点"
        }
      ]
    },
    {
      "name": "理发师阿杰",
      "messages": [
        {
          "mine": false,
          "text": "老顾客，好久没来啦"
        },
        {
          "mine": true,
          "text": "哈哈最近忙，这周想去剪个短的"
        },
        {
          "mine": false,
          "text": "周几来，我给你留位置"
        },
        {
          "mine": true,
          "text": "周六下午"
        },
        {
          "mine": false,
          "text": "两点行不"
        },
        {
          "mine": true,
          "text": "行，两点见"
        }
      ]
    },
    {
      "name": "牙医助理",
      "messages": [
        {
          "mine": false,
          "text": "提醒您明天上午十点洗牙预约"
        },
        {
          "mine": true,
          "text": "收到，会准时到"
        },
        {
          "mine": false,
          "text": "别忘了带上次的病历"
        },
        {
          "mine": true,
          "text": "好的，谢谢提醒"
        },
        {
          "mine": false,
          "text": "路上注意安全"
        }
      ]
    },
    {
      "name": "儿科护士",
      "messages": [
        {
          "mine": true,
          "text": "请问娃打疫苗需要空腹吗"
        },
        {
          "mine": false,
          "text": "不需要，正常吃饭就行"
        },
        {
          "mine": true,
          "text": "好的，明天几点方便"
        },
        {
          "mine": false,
          "text": "上午人少，九点左右来"
        },
        {
          "mine": true,
          "text": "谢谢，明天见"
        }
      ]
    },
    {
      "name": "幼儿园老师",
      "messages": [
        {
          "mine": false,
          "text": "家长您好，明天春游记得带水和帽子"
        },
        {
          "mine": true,
          "text": "好的老师，需要带午饭吗"
        },
        {
          "mine": false,
          "text": "带点小零食就行，园里管午饭"
        },
        {
          "mine": true,
          "text": "明白了，谢谢老师"
        },
        {
          "mine": false,
          "text": "不客气"
        }
      ]
    },
    {
      "name": "班主任王老师",
      "messages": [
        {
          "mine": true,
          "text": "王老师，孩子这次考试哪里薄弱"
        },
        {
          "mine": false,
          "text": "阅读理解要多练，其他还不错"
        },
        {
          "mine": true,
          "text": "好的，我在家多陪他读"
        },
        {
          "mine": false,
          "text": "每天读半小时就有效果"
        },
        {
          "mine": true,
          "text": "谢谢老师，辛苦了"
        },
        {
          "mine": false,
          "text": "应该的"
        }
      ]
    },
    {
      "name": "数学老师",
      "messages": [
        {
          "mine": false,
          "text": "这周作业请督促完成第三单元"
        },
        {
          "mine": true,
          "text": "好的，孩子昨晚做了一半"
        },
        {
          "mine": false,
          "text": "错题让他自己再订正一遍"
        },
        {
          "mine": true,
          "text": "明白，我盯着"
        },
        {
          "mine": false,
          "text": "有不会的可以问我"
        }
      ]
    },
    {
      "name": "钢琴老师",
      "messages": [
        {
          "mine": true,
          "text": "老师，孩子这周练得怎么样"
        },
        {
          "mine": false,
          "text": "手型好多了，就是节奏还要稳"
        },
        {
          "mine": true,
          "text": "回家我让他多用节拍器"
        },
        {
          "mine": false,
          "text": "对，慢练效果好"
        },
        {
          "mine": true,
          "text": "下节课几点"
        },
        {
          "mine": false,
          "text": "还是周三五点半"
        }
      ]
    },
    {
      "name": "舞蹈班助教",
      "messages": [
        {
          "mine": false,
          "text": "下周汇报演出，孩子要穿白袜子"
        },
        {
          "mine": true,
          "text": "好的，需要盘头发吗"
        },
        {
          "mine": false,
          "text": "需要，简单丸子头就行"
        },
        {
          "mine": true,
          "text": "明白，我提前弄好"
        },
        {
          "mine": false,
          "text": "提前二十分钟到化妆"
        }
      ]
    },
    {
      "name": "邻居赵阿姨",
      "messages": [
        {
          "mine": true,
          "text": "赵阿姨，明天我不在，快递能帮忙代收下不"
        },
        {
          "mine": false,
          "text": "行啊，放我这就成"
        },
        {
          "mine": true,
          "text": "太谢谢您了"
        },
        {
          "mine": false,
          "text": "客气啥，都是邻居"
        },
        {
          "mine": true,
          "text": "回来给您带点水果"
        },
        {
          "mine": false,
          "text": "别别别，收个快递而已"
        }
      ]
    },
    {
      "name": "邻居陈叔",
      "messages": [
        {
          "mine": false,
          "text": "你家阳台的花往下滴水了"
        },
        {
          "mine": true,
          "text": "哎呀不好意思，我这就搬进来"
        },
        {
          "mine": false,
          "text": "没事，提醒你一下"
        },
        {
          "mine": true,
          "text": "谢谢陈叔，以后注意"
        },
        {
          "mine": false,
          "text": "花养得挺好"
        }
      ]
    },
    {
      "name": "楼上小李",
      "messages": [
        {
          "mine": true,
          "text": "小李，晚上装修声音有点大"
        },
        {
          "mine": false,
          "text": "真不好意思，我马上停"
        },
        {
          "mine": true,
          "text": "没事，九点后停就行"
        },
        {
          "mine": false,
          "text": "好的好的，理解"
        },
        {
          "mine": true,
          "text": "都不容易，互相体谅"
        }
      ]
    },
    {
      "name": "保洁阿姨",
      "messages": [
        {
          "mine": false,
          "text": "这周三还是老时间吗"
        },
        {
          "mine": true,
          "text": "对，上午九点"
        },
        {
          "mine": false,
          "text": "好的，需要买清洁剂吗"
        },
        {
          "mine": true,
          "text": "厨房那瓶快没了，麻烦带一瓶"
        },
        {
          "mine": false,
          "text": "行，我记下了"
        }
      ]
    },
    {
      "name": "遛狗的老陈",
      "messages": [
        {
          "mine": true,
          "text": "陈叔，明早还一起遛狗不"
        },
        {
          "mine": false,
          "text": "遛，六点半公园门口"
        },
        {
          "mine": true,
          "text": "行，我家那只憋坏了"
        },
        {
          "mine": false,
          "text": "哈哈我家这只也是"
        },
        {
          "mine": true,
          "text": "明早见"
        }
      ]
    },
    {
      "name": "宠物医院小护士",
      "messages": [
        {
          "mine": false,
          "text": "提醒您狗狗下周该打疫苗了"
        },
        {
          "mine": true,
          "text": "好的，周末可以来吗"
        },
        {
          "mine": false,
          "text": "可以，周六上午方便"
        },
        {
          "mine": true,
          "text": "那我周六带它去"
        },
        {
          "mine": false,
          "text": "记得空腹别喂太多"
        },
        {
          "mine": true,
          "text": "明白，谢谢"
        }
      ]
    },
    {
      "name": "健身教练小赵",
      "messages": [
        {
          "mine": true,
          "text": "今晚的课改到明天行吗"
        },
        {
          "mine": false,
          "text": "行，明天七点"
        },
        {
          "mine": true,
          "text": "谢啦，今天太累了"
        },
        {
          "mine": false,
          "text": "注意休息，别硬撑"
        },
        {
          "mine": true,
          "text": "嗯，明天见"
        }
      ]
    },
    {
      "name": "瑜伽伙伴莉莉",
      "messages": [
        {
          "mine": false,
          "text": "明早的课你去吗"
        },
        {
          "mine": true,
          "text": "去啊，帮我占个后排位置"
        },
        {
          "mine": false,
          "text": "好，靠窗那个"
        },
        {
          "mine": true,
          "text": "谢啦，我带两块垫子"
        },
        {
          "mine": false,
          "text": "太好了，我忘带了"
        }
      ]
    },
    {
      "name": "同事小林",
      "messages": [
        {
          "mine": true,
          "text": "那个表格你改完发我了吗"
        },
        {
          "mine": false,
          "text": "刚发你邮箱了"
        },
        {
          "mine": true,
          "text": "收到，我看看"
        },
        {
          "mine": false,
          "text": "第三页数据你再核对下"
        },
        {
          "mine": true,
          "text": "好，一会儿给你回"
        },
        {
          "mine": false,
          "text": "不急，下班前就行"
        }
      ]
    },
    {
      "name": "同事老周",
      "messages": [
        {
          "mine": false,
          "text": "中午吃啥，一起呗"
        },
        {
          "mine": true,
          "text": "楼下那家面馆咋样"
        },
        {
          "mine": false,
          "text": "行，十二点走"
        },
        {
          "mine": true,
          "text": "好，我叫上小林"
        },
        {
          "mine": false,
          "text": "多叫俩人凑个桌"
        }
      ]
    },
    {
      "name": "主管张哥",
      "messages": [
        {
          "mine": true,
          "text": "张哥，明天的会几点"
        },
        {
          "mine": false,
          "text": "上午十点，会议室B"
        },
        {
          "mine": true,
          "text": "好的，需要我准备材料吗"
        },
        {
          "mine": false,
          "text": "把上季度的数据带上"
        },
        {
          "mine": true,
          "text": "没问题，我整理好"
        },
        {
          "mine": false,
          "text": "辛苦"
        }
      ]
    },
    {
      "name": "前台小妹",
      "messages": [
        {
          "mine": false,
          "text": "有您一个访客到了，在大厅"
        },
        {
          "mine": true,
          "text": "好的，我这就下去"
        },
        {
          "mine": false,
          "text": "让他在沙发那等着"
        },
        {
          "mine": true,
          "text": "谢谢，马上到"
        }
      ]
    },
    {
      "name": "实习生小郭",
      "messages": [
        {
          "mine": true,
          "text": "小郭，那批文件归档好了吗"
        },
        {
          "mine": false,
          "text": "好了，按日期排的"
        },
        {
          "mine": true,
          "text": "干得不错，下次按项目分类试试"
        },
        {
          "mine": false,
          "text": "好的，我这就调整"
        },
        {
          "mine": true,
          "text": "不急，慢慢来"
        },
        {
          "mine": false,
          "text": "谢谢指导"
        }
      ]
    },
    {
      "name": "客户王经理",
      "messages": [
        {
          "mine": false,
          "text": "样品收到了，挺满意"
        },
        {
          "mine": true,
          "text": "那太好了，有问题随时联系"
        },
        {
          "mine": false,
          "text": "下周想再订一批"
        },
        {
          "mine": true,
          "text": "好的，我把报价发您"
        },
        {
          "mine": false,
          "text": "麻烦了"
        },
        {
          "mine": true,
          "text": "应该的"
        }
      ]
    },
    {
      "name": "送水师傅",
      "messages": [
        {
          "mine": true,
          "text": "师傅，家里水没了，送两桶"
        },
        {
          "mine": false,
          "text": "好的，半小时到"
        },
        {
          "mine": true,
          "text": "麻烦搬到三楼"
        },
        {
          "mine": false,
          "text": "行，没电梯是吧"
        },
        {
          "mine": true,
          "text": "对，辛苦您了"
        },
        {
          "mine": false,
          "text": "小事"
        }
      ]
    },
    {
      "name": "外卖小哥",
      "messages": [
        {
          "mine": false,
          "text": "您好，您的餐到了放门口了"
        },
        {
          "mine": true,
          "text": "好的谢谢，辛苦"
        },
        {
          "mine": false,
          "text": "汤别洒了，我给立着放的"
        },
        {
          "mine": true,
          "text": "太贴心了，谢谢"
        },
        {
          "mine": false,
          "text": "不客气，慢用"
        }
      ]
    },
    {
      "name": "超市老板娘",
      "messages": [
        {
          "mine": true,
          "text": "今天有新鲜鸡蛋不"
        },
        {
          "mine": false,
          "text": "有，早上刚到的"
        },
        {
          "mine": true,
          "text": "给我留两板"
        },
        {
          "mine": false,
          "text": "行，给你放柜台后面"
        },
        {
          "mine": true,
          "text": "一会儿去拿"
        },
        {
          "mine": false,
          "text": "好嘞"
        }
      ]
    },
    {
      "name": "菜市场卖鱼的",
      "messages": [
        {
          "mine": false,
          "text": "今天草鱼便宜，要不"
        },
        {
          "mine": true,
          "text": "来一条，帮我收拾干净"
        },
        {
          "mine": false,
          "text": "行，去鳞去内脏"
        },
        {
          "mine": true,
          "text": "对，切两段"
        },
        {
          "mine": false,
          "text": "马上好"
        }
      ]
    },
    {
      "name": "水果摊老板",
      "messages": [
        {
          "mine": true,
          "text": "今天橙子甜不"
        },
        {
          "mine": false,
          "text": "甜，回甜的那种，尝一个"
        },
        {
          "mine": true,
          "text": "那来五斤"
        },
        {
          "mine": false,
          "text": "帮你挑大的"
        },
        {
          "mine": true,
          "text": "谢谢，多少钱"
        },
        {
          "mine": false,
          "text": "算你便宜点，二十五"
        }
      ]
    },
    {
      "name": "早餐店阿姨",
      "messages": [
        {
          "mine": false,
          "text": "老规矩豆浆油条"
        },
        {
          "mine": true,
          "text": "对，再加个茶叶蛋"
        },
        {
          "mine": false,
          "text": "豆浆要甜的吧"
        },
        {
          "mine": true,
          "text": "对，甜的"
        },
        {
          "mine": false,
          "text": "好嘞，马上"
        }
      ]
    },
    {
      "name": "麻辣烫老板",
      "messages": [
        {
          "mine": true,
          "text": "还开着吗，想打包一份"
        },
        {
          "mine": false,
          "text": "开着，要啥菜"
        },
        {
          "mine": true,
          "text": "青菜金针菇再来点丸子"
        },
        {
          "mine": false,
          "text": "微辣中辣"
        },
        {
          "mine": true,
          "text": "微辣就行"
        },
        {
          "mine": false,
          "text": "十分钟好"
        }
      ]
    },
    {
      "name": "奶茶店店员",
      "messages": [
        {
          "mine": false,
          "text": "您的单做好了，来取一下"
        },
        {
          "mine": true,
          "text": "好的，我马上到"
        },
        {
          "mine": false,
          "text": "少糖去冰那杯对吧"
        },
        {
          "mine": true,
          "text": "对，谢谢"
        },
        {
          "mine": false,
          "text": "慢走"
        }
      ]
    },
    {
      "name": "花店老板娘",
      "messages": [
        {
          "mine": true,
          "text": "明天要一束向日葵送人"
        },
        {
          "mine": false,
          "text": "要几支，包什么颜色的纸"
        },
        {
          "mine": true,
          "text": "九支，牛皮纸就行"
        },
        {
          "mine": false,
          "text": "好，几点来取"
        },
        {
          "mine": true,
          "text": "上午十点"
        },
        {
          "mine": false,
          "text": "给你搭点满天星"
        }
      ]
    },
    {
      "name": "干洗店老板",
      "messages": [
        {
          "mine": false,
          "text": "您那件大衣洗好了"
        },
        {
          "mine": true,
          "text": "好的，今天去取来得及吗"
        },
        {
          "mine": false,
          "text": "来得及，晚上八点关门"
        },
        {
          "mine": true,
          "text": "那我下班过去"
        },
        {
          "mine": false,
          "text": "带好取衣单"
        }
      ]
    },
    {
      "name": "修鞋匠",
      "messages": [
        {
          "mine": true,
          "text": "师傅，鞋跟掉了能修不"
        },
        {
          "mine": false,
          "text": "能，拿来我看看"
        },
        {
          "mine": true,
          "text": "好，一会儿过去"
        },
        {
          "mine": false,
          "text": "小修十块钟就好"
        },
        {
          "mine": true,
          "text": "谢谢师傅"
        }
      ]
    },
    {
      "name": "裁缝阿姨",
      "messages": [
        {
          "mine": false,
          "text": "裤子改好了，来试试长短"
        },
        {
          "mine": true,
          "text": "好的，明天去"
        },
        {
          "mine": false,
          "text": "腰你上次说紧了点是吧"
        },
        {
          "mine": true,
          "text": "对，松一指"
        },
        {
          "mine": false,
          "text": "改好了，你穿着看"
        }
      ]
    },
    {
      "name": "大学室友阿明",
      "messages": [
        {
          "mine": true,
          "text": "哥们好久不见，啥时候聚聚"
        },
        {
          "mine": false,
          "text": "下个月我出差路过你那"
        },
        {
          "mine": true,
          "text": "太好了，来我请你吃饭"
        },
        {
          "mine": false,
          "text": "行，到时候联系"
        },
        {
          "mine": true,
          "text": "老地方那家馆子还在"
        },
        {
          "mine": false,
          "text": "哈哈必须去"
        }
      ]
    },
    {
      "name": "大学室友小胖",
      "messages": [
        {
          "mine": false,
          "text": "你还记得咱们毕业照存哪了吗"
        },
        {
          "mine": true,
          "text": "我电脑里有备份，找找发你"
        },
        {
          "mine": false,
          "text": "太好了，想洗出来"
        },
        {
          "mine": true,
          "text": "晚上翻出来给你"
        },
        {
          "mine": false,
          "text": "谢啦兄弟"
        }
      ]
    },
    {
      "name": "高中同学婷婷",
      "messages": [
        {
          "mine": true,
          "text": "同学聚会你去不"
        },
        {
          "mine": false,
          "text": "去啊，好多年没见了"
        },
        {
          "mine": true,
          "text": "定在下个月中旬"
        },
        {
          "mine": false,
          "text": "行，到时候我请假"
        },
        {
          "mine": true,
          "text": "群里会通知具体时间"
        },
        {
          "mine": false,
          "text": "好，期待"
        }
      ]
    },
    {
      "name": "初中同学阿龙",
      "messages": [
        {
          "mine": false,
          "text": "你现在还在老家那边不"
        },
        {
          "mine": true,
          "text": "早搬市里了，你呢"
        },
        {
          "mine": false,
          "text": "我也在市里，改天喝个茶"
        },
        {
          "mine": true,
          "text": "好啊，周末有空"
        },
        {
          "mine": false,
          "text": "那约周六"
        },
        {
          "mine": true,
          "text": "行，地方你定"
        }
      ]
    },
    {
      "name": "老同学阿华",
      "messages": [
        {
          "mine": true,
          "text": "阿华，你家娃上几年级了"
        },
        {
          "mine": false,
          "text": "三年级了，调皮得很"
        },
        {
          "mine": true,
          "text": "哈哈都这样，我家也是"
        },
        {
          "mine": false,
          "text": "有空带娃一起玩"
        },
        {
          "mine": true,
          "text": "好啊，周末公园见"
        },
        {
          "mine": false,
          "text": "成"
        }
      ]
    },
    {
      "name": "驾校教练",
      "messages": [
        {
          "mine": false,
          "text": "明天上午练科目二，别迟到"
        },
        {
          "mine": true,
          "text": "好的教练，几点"
        },
        {
          "mine": false,
          "text": "八点半，先练倒库"
        },
        {
          "mine": true,
          "text": "收到，我提前到"
        },
        {
          "mine": false,
          "text": "带上身份证"
        }
      ]
    },
    {
      "name": "球友老丁",
      "messages": [
        {
          "mine": true,
          "text": "老丁，周六还打不"
        },
        {
          "mine": false,
          "text": "打，老地方"
        },
        {
          "mine": true,
          "text": "几个人"
        },
        {
          "mine": false,
          "text": "四个，够打两场"
        },
        {
          "mine": true,
          "text": "行，我带水"
        },
        {
          "mine": false,
          "text": "好"
        }
      ]
    },
    {
      "name": "钓鱼搭子",
      "messages": [
        {
          "mine": false,
          "text": "明天去水库不"
        },
        {
          "mine": true,
          "text": "去，天气咋样"
        },
        {
          "mine": false,
          "text": "多云，风不大，正合适"
        },
        {
          "mine": true,
          "text": "那早点走，占好位置"
        },
        {
          "mine": false,
          "text": "五点门口见"
        },
        {
          "mine": true,
          "text": "行"
        }
      ]
    },
    {
      "name": "广场舞王姐",
      "messages": [
        {
          "mine": true,
          "text": "王姐，今晚跳舞不"
        },
        {
          "mine": false,
          "text": "跳，广场老地方"
        },
        {
          "mine": true,
          "text": "换新曲子了吗"
        },
        {
          "mine": false,
          "text": "换了个新的，简单好学"
        },
        {
          "mine": true,
          "text": "那我早点去学"
        },
        {
          "mine": false,
          "text": "来吧，教你"
        }
      ]
    },
    {
      "name": "徒步搭子小雅",
      "messages": [
        {
          "mine": false,
          "text": "周末去爬山不"
        },
        {
          "mine": true,
          "text": "去，走哪条线"
        },
        {
          "mine": false,
          "text": "老路线，来回三小时"
        },
        {
          "mine": true,
          "text": "行，我带点吃的"
        },
        {
          "mine": false,
          "text": "多带水，山上贵"
        },
        {
          "mine": true,
          "text": "好嘞"
        }
      ]
    },
    {
      "name": "拼车师傅",
      "messages": [
        {
          "mine": true,
          "text": "师傅，明天早班还捎我不"
        },
        {
          "mine": false,
          "text": "捎，还是老地方等"
        },
        {
          "mine": true,
          "text": "好，七点整"
        },
        {
          "mine": false,
          "text": "别迟到，我准时走"
        },
        {
          "mine": true,
          "text": "放心"
        }
      ]
    },
    {
      "name": "顺风车张师傅",
      "messages": [
        {
          "mine": false,
          "text": "明天顺路，六点半接您"
        },
        {
          "mine": true,
          "text": "好的，还是小区门口"
        },
        {
          "mine": false,
          "text": "对，到了我打你电话"
        },
        {
          "mine": true,
          "text": "谢谢师傅"
        },
        {
          "mine": false,
          "text": "路上聊"
        }
      ]
    },
    {
      "name": "亲家母",
      "messages": [
        {
          "mine": true,
          "text": "亲家母，周末来我们家吃个饭吧"
        },
        {
          "mine": false,
          "text": "好啊，我带点自己包的粽子"
        },
        {
          "mine": true,
          "text": "那敢情好，孩子们最爱吃"
        },
        {
          "mine": false,
          "text": "几点合适"
        },
        {
          "mine": true,
          "text": "中午十一点半"
        },
        {
          "mine": false,
          "text": "行，我们准时到"
        }
      ]
    },
    {
      "name": "干妈",
      "messages": [
        {
          "mine": false,
          "text": "闺女最近忙不忙"
        },
        {
          "mine": true,
          "text": "还行，干妈你身体咋样"
        },
        {
          "mine": false,
          "text": "挺好，就是天冷腿有点凉"
        },
        {
          "mine": true,
          "text": "多穿点，我给你寄个护膝"
        },
        {
          "mine": false,
          "text": "别乱花钱"
        },
        {
          "mine": true,
          "text": "小东西，收着"
        }
      ]
    },
    {
      "name": "干爹",
      "messages": [
        {
          "mine": true,
          "text": "干爹，钓的鱼够吃不，我拿点冻着"
        },
        {
          "mine": false,
          "text": "够够够，来拿"
        },
        {
          "mine": true,
          "text": "那明天过去"
        },
        {
          "mine": false,
          "text": "顺便吃个饭"
        },
        {
          "mine": true,
          "text": "好嘞"
        }
      ]
    },
    {
      "name": "侄子",
      "messages": [
        {
          "mine": false,
          "text": "叔，我这道题不会做"
        },
        {
          "mine": true,
          "text": "拍照发我看看"
        },
        {
          "mine": false,
          "text": "发了"
        },
        {
          "mine": true,
          "text": "先列个式子，一步步来"
        },
        {
          "mine": false,
          "text": "哦我试试"
        },
        {
          "mine": true,
          "text": "不会再问"
        }
      ]
    },
    {
      "name": "侄女",
      "messages": [
        {
          "mine": true,
          "text": "丫头，生日想要啥礼物"
        },
        {
          "mine": false,
          "text": "想要个书包"
        },
        {
          "mine": true,
          "text": "行，什么颜色的"
        },
        {
          "mine": false,
          "text": "粉色的"
        },
        {
          "mine": true,
          "text": "记下了，生日给你"
        },
        {
          "mine": false,
          "text": "谢谢叔叔"
        }
      ]
    },
    {
      "name": "外甥",
      "messages": [
        {
          "mine": false,
          "text": "舅，周末带我去打球呗"
        },
        {
          "mine": true,
          "text": "行啊，周六下午"
        },
        {
          "mine": false,
          "text": "太好了"
        },
        {
          "mine": true,
          "text": "记得带球鞋"
        },
        {
          "mine": false,
          "text": "好嘞"
        }
      ]
    },
    {
      "name": "小姨子",
      "messages": [
        {
          "mine": true,
          "text": "你姐生日礼物你想好没"
        },
        {
          "mine": false,
          "text": "还没，姐夫你有主意不"
        },
        {
          "mine": true,
          "text": "她念叨那个包好久了"
        },
        {
          "mine": false,
          "text": "那咱俩合送吧"
        },
        {
          "mine": true,
          "text": "行，我先垫上"
        },
        {
          "mine": false,
          "text": "回头转你"
        }
      ]
    },
    {
      "name": "大伯",
      "messages": [
        {
          "mine": false,
          "text": "老家的枣熟了，给你们寄点"
        },
        {
          "mine": true,
          "text": "太好了，谢谢大伯"
        },
        {
          "mine": false,
          "text": "地址还是老的吧"
        },
        {
          "mine": true,
          "text": "对，没变"
        },
        {
          "mine": false,
          "text": "过两天就寄"
        }
      ]
    },
    {
      "name": "婶婶",
      "messages": [
        {
          "mine": true,
          "text": "婶婶，腊肉怎么腌的教教我"
        },
        {
          "mine": false,
          "text": "抹盐花椒，挂通风处晾"
        },
        {
          "mine": true,
          "text": "晾多久"
        },
        {
          "mine": false,
          "text": "半个月左右，看天"
        },
        {
          "mine": true,
          "text": "好，我试试"
        },
        {
          "mine": false,
          "text": "别放太多盐"
        }
      ]
    },
    {
      "name": "邻村二叔",
      "messages": [
        {
          "mine": false,
          "text": "地里的红薯挖了，来拿点"
        },
        {
          "mine": true,
          "text": "好嘞，二叔，周末去"
        },
        {
          "mine": false,
          "text": "多拿点，吃不完窖里放着"
        },
        {
          "mine": true,
          "text": "谢谢二叔"
        },
        {
          "mine": false,
          "text": "开车慢点"
        }
      ]
    }
  ],
};
