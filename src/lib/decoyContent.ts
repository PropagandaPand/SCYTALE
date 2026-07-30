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
      "name": "Lena",
      "messages": [
        {
          "mine": false,
          "text": "kommst du heute noch?"
        },
        {
          "mine": true,
          "text": "joa gleich, muss nur noch was fertig machen"
        },
        {
          "mine": false,
          "text": "ok wie lange"
        },
        {
          "mine": true,
          "text": "20 min vllt"
        },
        {
          "mine": false,
          "text": "sagst du seit ner stunde alter"
        },
        {
          "mine": true,
          "text": "jaa jaa ich schwör diesmal"
        }
      ]
    },
    {
      "name": "Max",
      "messages": [
        {
          "mine": true,
          "text": "digga hast du das gesehen gestern"
        },
        {
          "mine": false,
          "text": "was"
        },
        {
          "mine": true,
          "text": "das video das ich dir geschickt hab lol"
        },
        {
          "mine": false,
          "text": "achso ne noch nicht"
        },
        {
          "mine": false,
          "text": "guck ich später"
        }
      ]
    },
    {
      "name": "Julia",
      "messages": [
        {
          "mine": false,
          "text": "na wie wars"
        },
        {
          "mine": true,
          "text": "muss so"
        },
        {
          "mine": false,
          "text": "haha typisch"
        },
        {
          "mine": true,
          "text": "war eigtl ganz ok nur die bahn war voll die katastrophe"
        },
        {
          "mine": false,
          "text": "kenn ich"
        }
      ]
    },
    {
      "name": "Tom",
      "messages": [
        {
          "mine": true,
          "text": "bock heute abend zocken?"
        },
        {
          "mine": false,
          "text": "kp mal schauen"
        },
        {
          "mine": false,
          "text": "muss noch was für morgen machen"
        },
        {
          "mine": true,
          "text": "ach komm eine runde"
        },
        {
          "mine": false,
          "text": "ok aber wirklich nur eine"
        },
        {
          "mine": true,
          "text": "sagst du immer haha"
        }
      ]
    },
    {
      "name": "Finn",
      "messages": [
        {
          "mine": false,
          "text": "wo bist du"
        },
        {
          "mine": true,
          "text": "noch zuhause wieso"
        },
        {
          "mine": false,
          "text": "wir wollten doch um 3 los"
        },
        {
          "mine": true,
          "text": "oh shit hab verpennt"
        },
        {
          "mine": false,
          "text": "alter"
        },
        {
          "mine": true,
          "text": "bin in 15 da versprochen"
        }
      ]
    },
    {
      "name": "Basti",
      "messages": [
        {
          "mine": true,
          "text": "was machst du"
        },
        {
          "mine": false,
          "text": "nix rumhängen"
        },
        {
          "mine": true,
          "text": "bock spazieren"
        },
        {
          "mine": false,
          "text": "joa warum nicht"
        },
        {
          "mine": false,
          "text": "hol dich in 10 ab?"
        },
        {
          "mine": true,
          "text": "passt"
        }
      ]
    },
    {
      "name": "Konsti",
      "messages": [
        {
          "mine": false,
          "text": "hast du noch das ladekabel von mir"
        },
        {
          "mine": true,
          "text": "öhm glaub schon"
        },
        {
          "mine": true,
          "text": "ja liegt hier rum"
        },
        {
          "mine": false,
          "text": "bring morgen mit ja"
        },
        {
          "mine": true,
          "text": "jo"
        }
      ]
    },
    {
      "name": "Lu",
      "messages": [
        {
          "mine": true,
          "text": "lu bist du wach"
        },
        {
          "mine": false,
          "text": "nö"
        },
        {
          "mine": true,
          "text": "haha ok"
        },
        {
          "mine": false,
          "text": "was los"
        },
        {
          "mine": true,
          "text": "nix wollt nur reden aber schlaf weiter"
        }
      ]
    },
    {
      "name": "Mimi",
      "messages": [
        {
          "mine": false,
          "text": "ich kann heut doch nicht sry"
        },
        {
          "mine": true,
          "text": "hä wieso"
        },
        {
          "mine": false,
          "text": "muss babysitten für meine schwester"
        },
        {
          "mine": true,
          "text": "ok schade dann halt nächste woche"
        },
        {
          "mine": false,
          "text": "ja aufjedenfall hdl"
        }
      ]
    },
    {
      "name": "Anna Uni",
      "messages": [
        {
          "mine": false,
          "text": "hast du die folien von heute"
        },
        {
          "mine": true,
          "text": "ne war nicht da"
        },
        {
          "mine": false,
          "text": "omg wie kommen wir jetzt an die"
        },
        {
          "mine": true,
          "text": "frag mal im gruppenchat"
        },
        {
          "mine": false,
          "text": "gute idee"
        }
      ]
    },
    {
      "name": "Jonas WG",
      "messages": [
        {
          "mine": true,
          "text": "klopapier is alle"
        },
        {
          "mine": false,
          "text": "schon wieder"
        },
        {
          "mine": true,
          "text": "kannst du welches mitbringen"
        },
        {
          "mine": false,
          "text": "ja mach ich"
        },
        {
          "mine": false,
          "text": "aber du bist dran mit spülmittel"
        },
        {
          "mine": true,
          "text": "jaja"
        }
      ]
    },
    {
      "name": "Max Arbeit",
      "messages": [
        {
          "mine": false,
          "text": "kommst du zur pause mit runter"
        },
        {
          "mine": true,
          "text": "gleich hab noch ein call"
        },
        {
          "mine": false,
          "text": "ok warte am aufzug"
        },
        {
          "mine": true,
          "text": "jo 2 min"
        }
      ]
    },
    {
      "name": "Sarah Gym",
      "messages": [
        {
          "mine": false,
          "text": "gehst du morgen früh"
        },
        {
          "mine": true,
          "text": "wollt eigtl"
        },
        {
          "mine": false,
          "text": "7 uhr?"
        },
        {
          "mine": true,
          "text": "boah so früh"
        },
        {
          "mine": false,
          "text": "ja sonst is voll"
        },
        {
          "mine": true,
          "text": "okok bin dabei"
        }
      ]
    },
    {
      "name": "Schatz",
      "messages": [
        {
          "mine": false,
          "text": "fährst du gleich schon los?"
        },
        {
          "mine": true,
          "text": "ja gerade"
        },
        {
          "mine": false,
          "text": "kannst du milch mitbringen"
        },
        {
          "mine": true,
          "text": "klar sonst noch was"
        },
        {
          "mine": false,
          "text": "nö nur milch. und dich :)"
        },
        {
          "mine": true,
          "text": "haha bis gleich"
        }
      ]
    },
    {
      "name": "Maus",
      "messages": [
        {
          "mine": true,
          "text": "ich vermiss dich"
        },
        {
          "mine": false,
          "text": "awww ich dich auch"
        },
        {
          "mine": false,
          "text": "nur noch 2 tage"
        },
        {
          "mine": true,
          "text": "viel zu lang"
        },
        {
          "mine": false,
          "text": "weiß ich :("
        }
      ]
    },
    {
      "name": "Lena ❤️",
      "messages": [
        {
          "mine": false,
          "text": "schläfst du schon"
        },
        {
          "mine": true,
          "text": "fast"
        },
        {
          "mine": false,
          "text": "schlaf gut du"
        },
        {
          "mine": true,
          "text": "du auch träum was schönes"
        },
        {
          "mine": false,
          "text": "mach ich <3"
        }
      ]
    },
    {
      "name": "🐻",
      "messages": [
        {
          "mine": true,
          "text": "heut abend film?"
        },
        {
          "mine": false,
          "text": "ja gerne"
        },
        {
          "mine": false,
          "text": "welchen"
        },
        {
          "mine": true,
          "text": "weiß nicht such du was aus"
        },
        {
          "mine": false,
          "text": "immer ich haha"
        },
        {
          "mine": true,
          "text": "du hast besseren geschmack"
        }
      ]
    },
    {
      "name": "Mama",
      "messages": [
        {
          "mine": false,
          "text": "kommst du sonntag zum essen"
        },
        {
          "mine": true,
          "text": "ja glaub schon"
        },
        {
          "mine": false,
          "text": "gibt braten"
        },
        {
          "mine": true,
          "text": "mhh lecker um wie viel"
        },
        {
          "mine": false,
          "text": "halb eins wie immer"
        },
        {
          "mine": true,
          "text": "ok bin da"
        }
      ]
    },
    {
      "name": "Papa",
      "messages": [
        {
          "mine": true,
          "text": "papa läuft das spiel bei dir"
        },
        {
          "mine": false,
          "text": "ja grade an"
        },
        {
          "mine": true,
          "text": "steht schon was"
        },
        {
          "mine": false,
          "text": "0 zu 0 langweilig bisher"
        },
        {
          "mine": true,
          "text": "na super"
        }
      ]
    },
    {
      "name": "Mami",
      "messages": [
        {
          "mine": false,
          "text": "hast du gut heimgefunden"
        },
        {
          "mine": true,
          "text": "ja alles gut bin da"
        },
        {
          "mine": false,
          "text": "schön. hast du gegessen"
        },
        {
          "mine": true,
          "text": "jaa mama"
        },
        {
          "mine": false,
          "text": "gut. schlaf gut mein schatz"
        }
      ]
    },
    {
      "name": "Papi",
      "messages": [
        {
          "mine": false,
          "text": "brauchst du noch die bohrmaschine"
        },
        {
          "mine": true,
          "text": "ne kannst haben"
        },
        {
          "mine": false,
          "text": "hol ich am wochenende ab"
        },
        {
          "mine": true,
          "text": "passt liegt im keller"
        }
      ]
    },
    {
      "name": "Oma",
      "messages": [
        {
          "mine": false,
          "text": "na mein junge alles gut bei dir"
        },
        {
          "mine": true,
          "text": "ja oma alles gut und bei dir"
        },
        {
          "mine": false,
          "text": "ach weißt du das übliche"
        },
        {
          "mine": true,
          "text": "besuch dich bald mal"
        },
        {
          "mine": false,
          "text": "das würd mich freuen ich back kuchen"
        }
      ]
    },
    {
      "name": "Opa",
      "messages": [
        {
          "mine": true,
          "text": "opa funktioniert dein fernseher wieder"
        },
        {
          "mine": false,
          "text": "ja hab den stecker gezogen so wie du gesagt hast"
        },
        {
          "mine": true,
          "text": "haha sag ich doch"
        },
        {
          "mine": false,
          "text": "danke junge"
        }
      ]
    },
    {
      "name": "WG",
      "messages": [
        {
          "mine": true,
          "text": "wer war das mit dem geschirr"
        },
        {
          "mine": false,
          "text": "nicht ich"
        },
        {
          "mine": false,
          "text": "ich auch nicht"
        },
        {
          "mine": true,
          "text": "es steht seit 3 tagen da leute"
        },
        {
          "mine": false,
          "text": "ok ok ich mach heut abend küche"
        },
        {
          "mine": true,
          "text": "danke"
        }
      ]
    },
    {
      "name": "Familie",
      "messages": [
        {
          "mine": false,
          "text": "wer kommt alles an weihnachten"
        },
        {
          "mine": true,
          "text": "ich aufjedenfall"
        },
        {
          "mine": false,
          "text": "wir auch"
        },
        {
          "mine": false,
          "text": "opa fragt ob es wieder gans gibt"
        },
        {
          "mine": true,
          "text": "natürlich haha"
        }
      ]
    },
    {
      "name": "Mädels",
      "messages": [
        {
          "mine": false,
          "text": "mädels wochenende was geht"
        },
        {
          "mine": true,
          "text": "bin dabei egal was"
        },
        {
          "mine": false,
          "text": "cocktails bei mir?"
        },
        {
          "mine": false,
          "text": "jaaa"
        },
        {
          "mine": true,
          "text": "ich bring chips mit"
        },
        {
          "mine": false,
          "text": "perfekt samstag 8"
        }
      ]
    },
    {
      "name": "Fußball",
      "messages": [
        {
          "mine": false,
          "text": "training fällt heute aus platz gesperrt"
        },
        {
          "mine": true,
          "text": "nice frei"
        },
        {
          "mine": false,
          "text": "faul haha"
        },
        {
          "mine": false,
          "text": "sonntag spiel aber pünktlich"
        },
        {
          "mine": true,
          "text": "jaja"
        }
      ]
    },
    {
      "name": "Kegeltruppe",
      "messages": [
        {
          "mine": true,
          "text": "wer reserviert die bahn"
        },
        {
          "mine": false,
          "text": "mach ich"
        },
        {
          "mine": false,
          "text": "freitag 19 uhr wie immer?"
        },
        {
          "mine": true,
          "text": "jo passt"
        },
        {
          "mine": false,
          "text": "und diesmal keine absagen kurzfristig"
        }
      ]
    },
    {
      "name": "Nele",
      "messages": [
        {
          "mine": false,
          "text": "raaate mal wen ich getroffen hab"
        },
        {
          "mine": true,
          "text": "wen"
        },
        {
          "mine": false,
          "text": "den typen von der party"
        },
        {
          "mine": true,
          "text": "neinnn erzähl"
        },
        {
          "mine": false,
          "text": "ruf dich später an ist zu viel zum tippen"
        }
      ]
    },
    {
      "name": "Paul",
      "messages": [
        {
          "mine": true,
          "text": "kommst du mit mittag"
        },
        {
          "mine": false,
          "text": "was gibts"
        },
        {
          "mine": true,
          "text": "kp döner?"
        },
        {
          "mine": false,
          "text": "immer döner alter"
        },
        {
          "mine": true,
          "text": "ist halt gut"
        },
        {
          "mine": false,
          "text": "stimmt ja ok"
        }
      ]
    },
    {
      "name": "Marie",
      "messages": [
        {
          "mine": false,
          "text": "bist du sauer"
        },
        {
          "mine": true,
          "text": "nein wieso"
        },
        {
          "mine": false,
          "text": "weil du so kurz antwortest"
        },
        {
          "mine": true,
          "text": "bin nur müde echt alles gut"
        },
        {
          "mine": false,
          "text": "ok gut :)"
        }
      ]
    },
    {
      "name": "Jan",
      "messages": [
        {
          "mine": true,
          "text": "hast du das buch noch"
        },
        {
          "mine": false,
          "text": "welches"
        },
        {
          "mine": true,
          "text": "das ich dir letztes jahr geliehen hab lol"
        },
        {
          "mine": false,
          "text": "öh keine ahnung such mal"
        },
        {
          "mine": true,
          "text": "danke sehr hilfreich"
        }
      ]
    },
    {
      "name": "Emma",
      "messages": [
        {
          "mine": false,
          "text": "was ziehst du morgen an"
        },
        {
          "mine": true,
          "text": "kp irgendwas"
        },
        {
          "mine": false,
          "text": "hilf mir mal ich hab nix"
        },
        {
          "mine": true,
          "text": "du hast nen ganzen schrank haha"
        },
        {
          "mine": false,
          "text": "trotzdem nix zum anziehen"
        }
      ]
    },
    {
      "name": "Leon",
      "messages": [
        {
          "mine": false,
          "text": "wo treffen wir uns"
        },
        {
          "mine": true,
          "text": "vorm eingang"
        },
        {
          "mine": false,
          "text": "welcher eingang es gibt drei"
        },
        {
          "mine": true,
          "text": "der haupteingang mann"
        },
        {
          "mine": false,
          "text": "ah ok bin gleich da"
        }
      ]
    },
    {
      "name": "Hannah",
      "messages": [
        {
          "mine": true,
          "text": "gehts dir besser"
        },
        {
          "mine": false,
          "text": "bisschen ja"
        },
        {
          "mine": true,
          "text": "gut ruh dich aus"
        },
        {
          "mine": false,
          "text": "mach ich danke dass du fragst"
        }
      ]
    },
    {
      "name": "Ben",
      "messages": [
        {
          "mine": false,
          "text": "zocken heute?"
        },
        {
          "mine": true,
          "text": "kann nicht muss lernen"
        },
        {
          "mine": false,
          "text": "öde"
        },
        {
          "mine": true,
          "text": "sag ich auch aber prüfung freitag"
        },
        {
          "mine": false,
          "text": "viel erfolg dann bro"
        }
      ]
    },
    {
      "name": "Laura",
      "messages": [
        {
          "mine": false,
          "text": "hast du bock auf kaffee morgen"
        },
        {
          "mine": true,
          "text": "ja gerne wann"
        },
        {
          "mine": false,
          "text": "so 11?"
        },
        {
          "mine": true,
          "text": "passt beim üblichen laden?"
        },
        {
          "mine": false,
          "text": "jup bis dann"
        }
      ]
    },
    {
      "name": "Niklas",
      "messages": [
        {
          "mine": true,
          "text": "digga die klausur war brutal"
        },
        {
          "mine": false,
          "text": "oder alter"
        },
        {
          "mine": true,
          "text": "aufgabe 3 hab ich einfach leer gelassen"
        },
        {
          "mine": false,
          "text": "same"
        },
        {
          "mine": false,
          "text": "hoffentlich zählt der rest"
        }
      ]
    },
    {
      "name": "Sophie",
      "messages": [
        {
          "mine": false,
          "text": "kommst du zu meinem geburtstag"
        },
        {
          "mine": true,
          "text": "klar wann nochmal"
        },
        {
          "mine": false,
          "text": "samstag ab 8 bei mir"
        },
        {
          "mine": true,
          "text": "bin dabei was wünschst du dir"
        },
        {
          "mine": false,
          "text": "nur dass du kommst reicht"
        }
      ]
    },
    {
      "name": "Tim",
      "messages": [
        {
          "mine": true,
          "text": "bist du noch in der stadt"
        },
        {
          "mine": false,
          "text": "ja wieso"
        },
        {
          "mine": true,
          "text": "kannst du mich mitnehmen"
        },
        {
          "mine": false,
          "text": "wo musst du hin"
        },
        {
          "mine": true,
          "text": "nach hause richtung bahnhof"
        },
        {
          "mine": false,
          "text": "jo bin in 10 am parkhaus"
        }
      ]
    },
    {
      "name": "Lisa",
      "messages": [
        {
          "mine": false,
          "text": "ich glaub ich hab meinen schlüssel bei dir vergessen"
        },
        {
          "mine": true,
          "text": "moment ich guck"
        },
        {
          "mine": true,
          "text": "jap liegt aufm tisch"
        },
        {
          "mine": false,
          "text": "puh gott sei dank"
        },
        {
          "mine": false,
          "text": "komm gleich vorbei"
        }
      ]
    },
    {
      "name": "David",
      "messages": [
        {
          "mine": true,
          "text": "was war die hausaufgabe"
        },
        {
          "mine": false,
          "text": "seite 42 die ersten drei"
        },
        {
          "mine": true,
          "text": "danke retter"
        },
        {
          "mine": false,
          "text": "kein ding"
        }
      ]
    },
    {
      "name": "Katha",
      "messages": [
        {
          "mine": false,
          "text": "boah mein chef heute wieder"
        },
        {
          "mine": true,
          "text": "was hat er gemacht"
        },
        {
          "mine": false,
          "text": "5 uhr noch ne mail mit deadline morgen früh"
        },
        {
          "mine": true,
          "text": "was ein spast sry"
        },
        {
          "mine": false,
          "text": "nein du hast recht"
        }
      ]
    },
    {
      "name": "Flo",
      "messages": [
        {
          "mine": true,
          "text": "kommst du zum grillen samstag"
        },
        {
          "mine": false,
          "text": "wer is denn da"
        },
        {
          "mine": true,
          "text": "die üblichen verdächtigen"
        },
        {
          "mine": false,
          "text": "joa dann komm ich"
        },
        {
          "mine": true,
          "text": "bring was zu trinken mit"
        },
        {
          "mine": false,
          "text": "klar"
        }
      ]
    },
    {
      "name": "Vroni",
      "messages": [
        {
          "mine": false,
          "text": "hast du netflix passwort geändert"
        },
        {
          "mine": true,
          "text": "ne wieso"
        },
        {
          "mine": false,
          "text": "komm nicht mehr rein"
        },
        {
          "mine": true,
          "text": "probier nochmal manchmal spinnt das"
        },
        {
          "mine": false,
          "text": "ok jetzt gehts komisch"
        }
      ]
    },
    {
      "name": "Chris",
      "messages": [
        {
          "mine": true,
          "text": "alter ich steh im stau"
        },
        {
          "mine": false,
          "text": "wie lange noch"
        },
        {
          "mine": true,
          "text": "kp bewegt sich nix"
        },
        {
          "mine": false,
          "text": "ich fang schonmal an zu bestellen"
        },
        {
          "mine": true,
          "text": "ja mach hunger"
        }
      ]
    },
    {
      "name": "Merle",
      "messages": [
        {
          "mine": false,
          "text": "treffen wir uns vorher"
        },
        {
          "mine": true,
          "text": "ja um wie viel"
        },
        {
          "mine": false,
          "text": "halb 7 dann laufen wir zusammen"
        },
        {
          "mine": true,
          "text": "passt wo"
        },
        {
          "mine": false,
          "text": "bei mir vorm haus"
        }
      ]
    },
    {
      "name": "Timo",
      "messages": [
        {
          "mine": true,
          "text": "hast du morgen zeit umzug helfen"
        },
        {
          "mine": false,
          "text": "boah muss das sein"
        },
        {
          "mine": true,
          "text": "gibts pizza danach"
        },
        {
          "mine": false,
          "text": "na gut überredet"
        },
        {
          "mine": true,
          "text": "du bist der beste"
        }
      ]
    },
    {
      "name": "Jule",
      "messages": [
        {
          "mine": false,
          "text": "was machst du grad"
        },
        {
          "mine": true,
          "text": "liege im bett und mach nix"
        },
        {
          "mine": false,
          "text": "same energy"
        },
        {
          "mine": true,
          "text": "perfekter sonntag eigtl"
        },
        {
          "mine": false,
          "text": "absolut"
        }
      ]
    },
    {
      "name": "Robin",
      "messages": [
        {
          "mine": true,
          "text": "kommt der bus jetzt oder nicht"
        },
        {
          "mine": false,
          "text": "steht 5 min verspätung in der app"
        },
        {
          "mine": true,
          "text": "typisch"
        },
        {
          "mine": false,
          "text": "lauf halt haha"
        },
        {
          "mine": true,
          "text": "niemals bei dem wetter"
        }
      ]
    },
    {
      "name": "Pia",
      "messages": [
        {
          "mine": false,
          "text": "hast du das gehört von der lena"
        },
        {
          "mine": true,
          "text": "nein was"
        },
        {
          "mine": false,
          "text": "schreib dir gleich privat is nix für den chat"
        },
        {
          "mine": true,
          "text": "oh oh ok"
        }
      ]
    },
    {
      "name": "Luca",
      "messages": [
        {
          "mine": true,
          "text": "bock heut abend was trinken"
        },
        {
          "mine": false,
          "text": "joa wer noch"
        },
        {
          "mine": true,
          "text": "frag grad rum"
        },
        {
          "mine": false,
          "text": "sag bescheid wenn steht"
        },
        {
          "mine": true,
          "text": "mach ich"
        }
      ]
    },
    {
      "name": "Fabi",
      "messages": [
        {
          "mine": false,
          "text": "hast du meinen anruf gesehen"
        },
        {
          "mine": true,
          "text": "ne sry war im kino"
        },
        {
          "mine": false,
          "text": "achso war nix wichtiges"
        },
        {
          "mine": true,
          "text": "was gibts denn"
        },
        {
          "mine": false,
          "text": "erzähl ich dir morgen"
        }
      ]
    },
    {
      "name": "Nina",
      "messages": [
        {
          "mine": false,
          "text": "kommst du mit shoppen"
        },
        {
          "mine": true,
          "text": "heute ne keine kohle"
        },
        {
          "mine": false,
          "text": "nur gucken"
        },
        {
          "mine": true,
          "text": "bei dir gibts kein nur gucken haha"
        },
        {
          "mine": false,
          "text": "stimmt eig"
        }
      ]
    },
    {
      "name": "Kevin",
      "messages": [
        {
          "mine": true,
          "text": "hast du die tickets"
        },
        {
          "mine": false,
          "text": "ja hab beide"
        },
        {
          "mine": true,
          "text": "nice wann treffen"
        },
        {
          "mine": false,
          "text": "18 uhr am eingang reicht"
        },
        {
          "mine": true,
          "text": "top freu mich"
        }
      ]
    },
    {
      "name": "Steffi",
      "messages": [
        {
          "mine": false,
          "text": "ich flieg gleich ab meld mich wenn ich lande"
        },
        {
          "mine": true,
          "text": "gute reise!!"
        },
        {
          "mine": false,
          "text": "danke <3"
        },
        {
          "mine": true,
          "text": "schreib wenn du da bist ja"
        },
        {
          "mine": false,
          "text": "mach ich versprochen"
        }
      ]
    },
    {
      "name": "Malte",
      "messages": [
        {
          "mine": true,
          "text": "kommst du heute zum training"
        },
        {
          "mine": false,
          "text": "nö rücken"
        },
        {
          "mine": true,
          "text": "schon wieder dein rücken"
        },
        {
          "mine": false,
          "text": "alter ich werd alt"
        },
        {
          "mine": true,
          "text": "haha bis nächste woche"
        }
      ]
    },
    {
      "name": "Caro",
      "messages": [
        {
          "mine": false,
          "text": "wie heißt nochmal das café das du meintest"
        },
        {
          "mine": true,
          "text": "das kleine in der seitenstraße"
        },
        {
          "mine": false,
          "text": "welche seitenstraße lol"
        },
        {
          "mine": true,
          "text": "ich schick dir gleich den link"
        },
        {
          "mine": false,
          "text": "danke"
        }
      ]
    },
    {
      "name": "Dennis",
      "messages": [
        {
          "mine": true,
          "text": "hast du feuer"
        },
        {
          "mine": false,
          "text": "ne rauch nicht mehr weißt du doch"
        },
        {
          "mine": true,
          "text": "ach stimmt respekt übrigens"
        },
        {
          "mine": false,
          "text": "danke 3 wochen jetzt"
        },
        {
          "mine": true,
          "text": "stark"
        }
      ]
    },
    {
      "name": "Josi",
      "messages": [
        {
          "mine": false,
          "text": "guckst du die serie noch"
        },
        {
          "mine": true,
          "text": "ja bin bei folge 4"
        },
        {
          "mine": false,
          "text": "spoiler alarm ich bin noch bei 2"
        },
        {
          "mine": true,
          "text": "dann red ich nix haha"
        },
        {
          "mine": false,
          "text": "gut so"
        }
      ]
    },
    {
      "name": "Moritz",
      "messages": [
        {
          "mine": true,
          "text": "wo ist eigtl mein pulli"
        },
        {
          "mine": false,
          "text": "welcher"
        },
        {
          "mine": true,
          "text": "der graue den ich immer anhab"
        },
        {
          "mine": false,
          "text": "lag doch bei dir aufm stuhl"
        },
        {
          "mine": true,
          "text": "ach ja gefunden danke"
        }
      ]
    },
    {
      "name": "Alina",
      "messages": [
        {
          "mine": false,
          "text": "bist du auch so müde heute"
        },
        {
          "mine": true,
          "text": "ja voll kein plan warum"
        },
        {
          "mine": false,
          "text": "wetter vllt"
        },
        {
          "mine": true,
          "text": "kann sein grau ohne ende"
        },
        {
          "mine": false,
          "text": "kaffee zeit"
        }
      ]
    },
    {
      "name": "Simon",
      "messages": [
        {
          "mine": true,
          "text": "kommst du sonntag mit wandern"
        },
        {
          "mine": false,
          "text": "wie weit"
        },
        {
          "mine": true,
          "text": "so 12 km nix wildes"
        },
        {
          "mine": false,
          "text": "12 is nix wildes ja klar"
        },
        {
          "mine": true,
          "text": "komm schon lohnt sich aussicht mega"
        },
        {
          "mine": false,
          "text": "na gut"
        }
      ]
    },
    {
      "name": "Greta",
      "messages": [
        {
          "mine": false,
          "text": "hast du zeit kurz telefonieren"
        },
        {
          "mine": true,
          "text": "gib mir 10 min bin grad mitten drin"
        },
        {
          "mine": false,
          "text": "ok ruf an wenn du kannst"
        },
        {
          "mine": true,
          "text": "mach ich"
        }
      ]
    },
    {
      "name": "Philipp",
      "messages": [
        {
          "mine": true,
          "text": "schon wach"
        },
        {
          "mine": false,
          "text": "leider"
        },
        {
          "mine": true,
          "text": "haha frühstück?"
        },
        {
          "mine": false,
          "text": "jaa wo"
        },
        {
          "mine": true,
          "text": "beim bäcker am platz"
        },
        {
          "mine": false,
          "text": "bin in 20"
        }
      ]
    },
    {
      "name": "Kim",
      "messages": [
        {
          "mine": false,
          "text": "ich hab was total peinliches gemacht"
        },
        {
          "mine": true,
          "text": "oh nein was"
        },
        {
          "mine": false,
          "text": "hab jemandem gewunken der gar nicht mich meinte"
        },
        {
          "mine": true,
          "text": "HAHA klassiker"
        },
        {
          "mine": false,
          "text": "ich will im boden versinken"
        }
      ]
    },
    {
      "name": "Tobi",
      "messages": [
        {
          "mine": true,
          "text": "hast du den ausweis dabei heut abend"
        },
        {
          "mine": false,
          "text": "warum"
        },
        {
          "mine": true,
          "text": "türsteher check halt"
        },
        {
          "mine": false,
          "text": "ach stimmt ja hol ich"
        },
        {
          "mine": true,
          "text": "gut sonst stehst du draußen"
        }
      ]
    },
    {
      "name": "Ronja",
      "messages": [
        {
          "mine": false,
          "text": "morgen doch nicht wetter is mies"
        },
        {
          "mine": true,
          "text": "och menno"
        },
        {
          "mine": false,
          "text": "verschieben wir auf nächste woche"
        },
        {
          "mine": true,
          "text": "ok welcher tag"
        },
        {
          "mine": false,
          "text": "schau ich und sag bescheid"
        }
      ]
    },
    {
      "name": "Micha",
      "messages": [
        {
          "mine": true,
          "text": "bro brauch deinen rat"
        },
        {
          "mine": false,
          "text": "schieß los"
        },
        {
          "mine": true,
          "text": "soll ich ihr schreiben oder nicht"
        },
        {
          "mine": false,
          "text": "schreib ihr mann grübel nicht so"
        },
        {
          "mine": true,
          "text": "ok mach ich"
        }
      ]
    },
    {
      "name": "Svenja",
      "messages": [
        {
          "mine": false,
          "text": "hast du die reste noch von gestern"
        },
        {
          "mine": true,
          "text": "ja steht im kühlschrank"
        },
        {
          "mine": false,
          "text": "darf ich"
        },
        {
          "mine": true,
          "text": "klar hau rein"
        },
        {
          "mine": false,
          "text": "danke rettung"
        }
      ]
    },
    {
      "name": "Jakob",
      "messages": [
        {
          "mine": true,
          "text": "kommst du zum spiel gucken"
        },
        {
          "mine": false,
          "text": "wo läufts denn"
        },
        {
          "mine": true,
          "text": "bei mir hab die glotze"
        },
        {
          "mine": false,
          "text": "joa bring bier mit?"
        },
        {
          "mine": true,
          "text": "logisch"
        }
      ]
    },
    {
      "name": "Lea",
      "messages": [
        {
          "mine": false,
          "text": "hab dich grad in der stadt gesehen glaub ich"
        },
        {
          "mine": true,
          "text": "war ich das echt"
        },
        {
          "mine": false,
          "text": "kam mir so vor rote jacke?"
        },
        {
          "mine": true,
          "text": "ne war heut nicht draußen doppelgänger haha"
        },
        {
          "mine": false,
          "text": "gruselig"
        }
      ]
    },
    {
      "name": "Marco",
      "messages": [
        {
          "mine": true,
          "text": "leihst du mir 20 bis freitag"
        },
        {
          "mine": false,
          "text": "joa kein ding"
        },
        {
          "mine": true,
          "text": "danke rette mich grad"
        },
        {
          "mine": false,
          "text": "schick dirs gleich"
        },
        {
          "mine": true,
          "text": "top hdl"
        }
      ]
    },
    {
      "name": "Antonia",
      "messages": [
        {
          "mine": false,
          "text": "was schenken wir mama"
        },
        {
          "mine": true,
          "text": "kp hab null idee"
        },
        {
          "mine": false,
          "text": "vielleicht was fürn garten"
        },
        {
          "mine": true,
          "text": "gute idee lass uns morgen zusammen schauen"
        },
        {
          "mine": false,
          "text": "ok"
        }
      ]
    },
    {
      "name": "Erik",
      "messages": [
        {
          "mine": true,
          "text": "pizza order was willst du"
        },
        {
          "mine": false,
          "text": "salami wie immer"
        },
        {
          "mine": true,
          "text": "langweiler"
        },
        {
          "mine": false,
          "text": "funktioniert halt"
        },
        {
          "mine": true,
          "text": "ok kommt in 40"
        }
      ]
    },
    {
      "name": "Franzi",
      "messages": [
        {
          "mine": false,
          "text": "ich zieh doch in die neue wohnung"
        },
        {
          "mine": true,
          "text": "omg glückwunsch!!"
        },
        {
          "mine": false,
          "text": "danke bin so aufgeregt"
        },
        {
          "mine": true,
          "text": "wann gehts los"
        },
        {
          "mine": false,
          "text": "nächsten monat brauch aber umzugshelfer haha"
        },
        {
          "mine": true,
          "text": "bin dabei"
        }
      ]
    },
    {
      "name": "Hendrik",
      "messages": [
        {
          "mine": true,
          "text": "wer bringt die musikbox mit"
        },
        {
          "mine": false,
          "text": "hab ich"
        },
        {
          "mine": true,
          "text": "nice und decken"
        },
        {
          "mine": false,
          "text": "nehm ich auch"
        },
        {
          "mine": true,
          "text": "dann fehlt nur noch essen"
        }
      ]
    },
    {
      "name": "Melli",
      "messages": [
        {
          "mine": false,
          "text": "bist du noch auf"
        },
        {
          "mine": true,
          "text": "jaa"
        },
        {
          "mine": false,
          "text": "kann nicht schlafen"
        },
        {
          "mine": true,
          "text": "was is los"
        },
        {
          "mine": false,
          "text": "kopf einfach zu voll"
        },
        {
          "mine": true,
          "text": "komm wir telefonieren kurz"
        }
      ]
    },
    {
      "name": "Bruno",
      "messages": [
        {
          "mine": true,
          "text": "gassi in 10?"
        },
        {
          "mine": false,
          "text": "wer bruno oder du haha"
        },
        {
          "mine": true,
          "text": "beide"
        },
        {
          "mine": false,
          "text": "ok bin dabei runde um den see?"
        },
        {
          "mine": true,
          "text": "jo"
        }
      ]
    },
    {
      "name": "Charlotte",
      "messages": [
        {
          "mine": false,
          "text": "hast du das rezept noch von deiner oma"
        },
        {
          "mine": true,
          "text": "ja soll ichs abschreiben"
        },
        {
          "mine": false,
          "text": "jaaa bitte will das nachkochen"
        },
        {
          "mine": true,
          "text": "mach ich foto und schick"
        },
        {
          "mine": false,
          "text": "du bist ein schatz"
        }
      ]
    },
    {
      "name": "Sven",
      "messages": [
        {
          "mine": true,
          "text": "kommst du zur after work runde"
        },
        {
          "mine": false,
          "text": "heute nicht bin platt"
        },
        {
          "mine": true,
          "text": "schwächling"
        },
        {
          "mine": false,
          "text": "nächste woche versprochen"
        },
        {
          "mine": true,
          "text": "das sagst du jedes mal"
        }
      ]
    },
    {
      "name": "Isa",
      "messages": [
        {
          "mine": false,
          "text": "wie findest du den namen für die katze"
        },
        {
          "mine": true,
          "text": "welchen nochmal"
        },
        {
          "mine": false,
          "text": "keks"
        },
        {
          "mine": true,
          "text": "haha süß nimm keks"
        },
        {
          "mine": false,
          "text": "ne oder doch. ok keks"
        }
      ]
    },
    {
      "name": "Domi",
      "messages": [
        {
          "mine": true,
          "text": "training heut wer fährt"
        },
        {
          "mine": false,
          "text": "ich kann fahren"
        },
        {
          "mine": true,
          "text": "nice holst du mich ab"
        },
        {
          "mine": false,
          "text": "jo halb 6 unten sein"
        },
        {
          "mine": true,
          "text": "bin da"
        }
      ]
    },
    {
      "name": "Lara",
      "messages": [
        {
          "mine": false,
          "text": "ich hab die falsche bahn genommen lol"
        },
        {
          "mine": true,
          "text": "wie schaffst du das immer"
        },
        {
          "mine": false,
          "text": "talent"
        },
        {
          "mine": true,
          "text": "komm halt einfach zurück"
        },
        {
          "mine": false,
          "text": "bin schon dabei bin 20 min später"
        }
      ]
    },
    {
      "name": "Nico",
      "messages": [
        {
          "mine": true,
          "text": "bock auf kino am wochenende"
        },
        {
          "mine": false,
          "text": "was läuft denn"
        },
        {
          "mine": true,
          "text": "der neue action film"
        },
        {
          "mine": false,
          "text": "joa immer bock auf action"
        },
        {
          "mine": true,
          "text": "samstag abend?"
        },
        {
          "mine": false,
          "text": "passt"
        }
      ]
    },
    {
      "name": "Pauline",
      "messages": [
        {
          "mine": false,
          "text": "hab dir was mitgebracht aus dem urlaub"
        },
        {
          "mine": true,
          "text": "awww was denn"
        },
        {
          "mine": false,
          "text": "wird nicht verraten überraschung"
        },
        {
          "mine": true,
          "text": "jetzt bin ich neugierig"
        },
        {
          "mine": false,
          "text": "geduld :)"
        }
      ]
    },
    {
      "name": "Rick",
      "messages": [
        {
          "mine": true,
          "text": "digga wo warst du gestern"
        },
        {
          "mine": false,
          "text": "eingepennt aufm sofa"
        },
        {
          "mine": true,
          "text": "alter du verpasst alles"
        },
        {
          "mine": false,
          "text": "erzähl"
        },
        {
          "mine": true,
          "text": "später am telefon zu viel"
        }
      ]
    },
    {
      "name": "Vanessa",
      "messages": [
        {
          "mine": false,
          "text": "kommst du mit zum see morgen"
        },
        {
          "mine": true,
          "text": "wenn wetter passt gerne"
        },
        {
          "mine": false,
          "text": "soll sonnig werden"
        },
        {
          "mine": true,
          "text": "dann bin ich dabei was mitbringen"
        },
        {
          "mine": false,
          "text": "nur handtuch und gute laune"
        }
      ]
    },
    {
      "name": "Ole",
      "messages": [
        {
          "mine": true,
          "text": "hast du noch das bohrer set"
        },
        {
          "mine": false,
          "text": "ja klar wann brauchst dus"
        },
        {
          "mine": true,
          "text": "am wochenende bild aufhängen"
        },
        {
          "mine": false,
          "text": "komm vorbei liegt in der garage"
        },
        {
          "mine": true,
          "text": "top danke"
        }
      ]
    },
    {
      "name": "Theresa",
      "messages": [
        {
          "mine": false,
          "text": "lange nicht gehört wie gehts dir"
        },
        {
          "mine": true,
          "text": "ganz gut viel stress grad und selbst"
        },
        {
          "mine": false,
          "text": "kenn ich lass uns mal treffen"
        },
        {
          "mine": true,
          "text": "unbedingt bald mal kaffee"
        },
        {
          "mine": false,
          "text": "ja mach ich fest woche drauf"
        }
      ]
    },
    {
      "name": "Basti Uni",
      "messages": [
        {
          "mine": true,
          "text": "lernst du für morgen"
        },
        {
          "mine": false,
          "text": "ja versuch es"
        },
        {
          "mine": true,
          "text": "zusammen in der bib?"
        },
        {
          "mine": false,
          "text": "jo bin schon da 2 og"
        },
        {
          "mine": true,
          "text": "komm gleich"
        }
      ]
    },
    {
      "name": "Anna Gym",
      "messages": [
        {
          "mine": false,
          "text": "neuer kurs heut abend spinning bock?"
        },
        {
          "mine": true,
          "text": "boah spinning ist die hölle"
        },
        {
          "mine": false,
          "text": "genau deswegen komm mit"
        },
        {
          "mine": true,
          "text": "na gut aber danach smoothie"
        },
        {
          "mine": false,
          "text": "deal"
        }
      ]
    },
    {
      "name": "Lukas WG",
      "messages": [
        {
          "mine": true,
          "text": "wer hat die heizung so hoch gedreht"
        },
        {
          "mine": false,
          "text": "ich hab gefroren sry"
        },
        {
          "mine": true,
          "text": "is ja tropen hier"
        },
        {
          "mine": false,
          "text": "mach ich runter chill"
        },
        {
          "mine": true,
          "text": "danke"
        }
      ]
    },
    {
      "name": "Sarah Arbeit",
      "messages": [
        {
          "mine": false,
          "text": "deckst du mich morgen 10 min später"
        },
        {
          "mine": true,
          "text": "klar mach ich chef merkts eh nicht"
        },
        {
          "mine": false,
          "text": "du bist gold wert"
        },
        {
          "mine": true,
          "text": "schulde mir aber nen kaffee"
        },
        {
          "mine": false,
          "text": "abgemacht"
        }
      ]
    },
    {
      "name": "Uschi",
      "messages": [
        {
          "mine": false,
          "text": "na meine liebe alles gut bei euch"
        },
        {
          "mine": true,
          "text": "ja alles bestens und bei dir"
        },
        {
          "mine": false,
          "text": "kann nicht klagen der garten macht arbeit"
        },
        {
          "mine": true,
          "text": "das kenn ich haha"
        },
        {
          "mine": false,
          "text": "komm mal vorbei gibt kaffee und kuchen"
        }
      ]
    },
    {
      "name": "Sammy",
      "messages": [
        {
          "mine": false,
          "text": "bist du auf der feier heute"
        },
        {
          "mine": true,
          "text": "überleg noch"
        },
        {
          "mine": false,
          "text": "komm schon wird lustig"
        },
        {
          "mine": true,
          "text": "wer is denn da"
        },
        {
          "mine": false,
          "text": "alle die üblichen"
        },
        {
          "mine": true,
          "text": "ok überredet"
        }
      ]
    },
    {
      "name": "Verein",
      "messages": [
        {
          "mine": false,
          "text": "sommerfest planung wer hilft"
        },
        {
          "mine": true,
          "text": "ich beim aufbau"
        },
        {
          "mine": false,
          "text": "super trag ich ein"
        },
        {
          "mine": false,
          "text": "noch wer für die kasse?"
        },
        {
          "mine": true,
          "text": "frag mal den jakob der macht sowas gern"
        }
      ]
    },
    {
      "name": "Zocker",
      "messages": [
        {
          "mine": true,
          "text": "heute abend runde jemand?"
        },
        {
          "mine": false,
          "text": "bin dabei ab 8"
        },
        {
          "mine": false,
          "text": "ich auch"
        },
        {
          "mine": true,
          "text": "nice dann 8 im üblichen chat"
        },
        {
          "mine": false,
          "text": "team diesmal bitte kommunikation lol"
        },
        {
          "mine": true,
          "text": "haha ja ja"
        }
      ]
    },
    {
      "name": "Nachbarn",
      "messages": [
        {
          "mine": false,
          "text": "paket für euch angenommen kommt vorbei wann ihr wollt"
        },
        {
          "mine": true,
          "text": "oh super danke komm gleich rüber"
        },
        {
          "mine": false,
          "text": "passt bin da"
        },
        {
          "mine": true,
          "text": "und danke fürs blumengießen neulich"
        },
        {
          "mine": false,
          "text": "immer gerne"
        }
      ]
    },
    {
      "name": "Wandergruppe",
      "messages": [
        {
          "mine": false,
          "text": "sonntag route steht treffpunkt parkplatz 9 uhr"
        },
        {
          "mine": true,
          "text": "bin dabei"
        },
        {
          "mine": false,
          "text": "denkt an gute schuhe wird matschig"
        },
        {
          "mine": true,
          "text": "und brotzeit nicht vergessen haha"
        },
        {
          "mine": false,
          "text": "das wichtigste"
        }
      ]
    }
  ],
  "en": [
    {
      "name": "Emma",
      "messages": [
        {
          "mine": false,
          "text": "you still coming tn"
        },
        {
          "mine": true,
          "text": "ye think so"
        },
        {
          "mine": true,
          "text": "what time again"
        },
        {
          "mine": false,
          "text": "like 8ish"
        },
        {
          "mine": false,
          "text": "dont flake pls"
        },
        {
          "mine": true,
          "text": "lol when have i ever"
        },
        {
          "mine": false,
          "text": "literally last week"
        }
      ]
    },
    {
      "name": "Jake",
      "messages": [
        {
          "mine": true,
          "text": "bro did u see the game"
        },
        {
          "mine": false,
          "text": "nah slept through it"
        },
        {
          "mine": true,
          "text": "absolute robbery"
        },
        {
          "mine": false,
          "text": "of course"
        },
        {
          "mine": true,
          "text": "i cant even talk about it"
        },
        {
          "mine": false,
          "text": "lmao"
        }
      ]
    },
    {
      "name": "Liv",
      "messages": [
        {
          "mine": false,
          "text": "omg guess who i just saw"
        },
        {
          "mine": true,
          "text": "who"
        },
        {
          "mine": false,
          "text": "dan. in tesco. with HER"
        },
        {
          "mine": true,
          "text": "no way"
        },
        {
          "mine": true,
          "text": "send pics"
        },
        {
          "mine": false,
          "text": "i cant just take pics in tesco liv"
        },
        {
          "mine": true,
          "text": "why not"
        }
      ]
    },
    {
      "name": "Mom",
      "messages": [
        {
          "mine": false,
          "text": "you eating properly?"
        },
        {
          "mine": true,
          "text": "yes mom"
        },
        {
          "mine": false,
          "text": "hmm"
        },
        {
          "mine": false,
          "text": "call your gran shes been asking"
        },
        {
          "mine": true,
          "text": "ok will do tmrw"
        },
        {
          "mine": false,
          "text": "today"
        }
      ]
    },
    {
      "name": "Dad",
      "messages": [
        {
          "mine": true,
          "text": "can you send me that recipe"
        },
        {
          "mine": false,
          "text": "which one"
        },
        {
          "mine": true,
          "text": "the chicken thing you did xmas"
        },
        {
          "mine": false,
          "text": "ask your mother"
        },
        {
          "mine": true,
          "text": "classic"
        }
      ]
    },
    {
      "name": "Sam",
      "messages": [
        {
          "mine": false,
          "text": "you up"
        },
        {
          "mine": true,
          "text": "barely"
        },
        {
          "mine": false,
          "text": "coffee?"
        },
        {
          "mine": true,
          "text": "give me 20"
        },
        {
          "mine": false,
          "text": "same place"
        }
      ]
    },
    {
      "name": "Chloe",
      "messages": [
        {
          "mine": true,
          "text": "i am never drinking again"
        },
        {
          "mine": false,
          "text": "you said that saturday"
        },
        {
          "mine": true,
          "text": "i mean it this time"
        },
        {
          "mine": false,
          "text": "sure jan"
        },
        {
          "mine": true,
          "text": "how are you even functioning"
        },
        {
          "mine": false,
          "text": "had a bacon roll, sorted"
        }
      ]
    },
    {
      "name": "Danny",
      "messages": [
        {
          "mine": false,
          "text": "you left your charger here"
        },
        {
          "mine": true,
          "text": "knew i forgot smth"
        },
        {
          "mine": false,
          "text": "ill bring it thurs"
        },
        {
          "mine": true,
          "text": "legend ta"
        }
      ]
    },
    {
      "name": "Nat",
      "messages": [
        {
          "mine": true,
          "text": "what you wearing tmrw"
        },
        {
          "mine": false,
          "text": "idk jeans probs"
        },
        {
          "mine": true,
          "text": "not fancy then"
        },
        {
          "mine": false,
          "text": "is it fancy??"
        },
        {
          "mine": true,
          "text": "idk thats why im asking"
        },
        {
          "mine": false,
          "text": "omg"
        }
      ]
    },
    {
      "name": "Beth",
      "messages": [
        {
          "mine": false,
          "text": "i think i left the oven on"
        },
        {
          "mine": true,
          "text": "you did not"
        },
        {
          "mine": false,
          "text": "im not home to check"
        },
        {
          "mine": true,
          "text": "beth youre gonna spiral"
        },
        {
          "mine": false,
          "text": "already spiralling"
        },
        {
          "mine": true,
          "text": "its off. it always is"
        }
      ]
    },
    {
      "name": "Anna uni",
      "messages": [
        {
          "mine": false,
          "text": "did u do the reading"
        },
        {
          "mine": true,
          "text": "lol no"
        },
        {
          "mine": false,
          "text": "same"
        },
        {
          "mine": false,
          "text": "wanna blag it together in the library"
        },
        {
          "mine": true,
          "text": "2pm?"
        },
        {
          "mine": false,
          "text": "yh"
        }
      ]
    },
    {
      "name": "Max work",
      "messages": [
        {
          "mine": true,
          "text": "is the standup still on"
        },
        {
          "mine": false,
          "text": "moved to 10"
        },
        {
          "mine": true,
          "text": "nobody tells me anything"
        },
        {
          "mine": false,
          "text": "i just did"
        },
        {
          "mine": true,
          "text": "fair"
        }
      ]
    },
    {
      "name": "Sarah gym",
      "messages": [
        {
          "mine": false,
          "text": "legs today or you skipping again"
        },
        {
          "mine": true,
          "text": "i came yesterday!!"
        },
        {
          "mine": false,
          "text": "and today?"
        },
        {
          "mine": true,
          "text": "fine 6pm"
        },
        {
          "mine": false,
          "text": "good, dont be late"
        }
      ]
    },
    {
      "name": "babe",
      "messages": [
        {
          "mine": false,
          "text": "what do u want for dinner"
        },
        {
          "mine": true,
          "text": "idk you pick"
        },
        {
          "mine": false,
          "text": "no you always say that then complain"
        },
        {
          "mine": true,
          "text": "i do not"
        },
        {
          "mine": false,
          "text": "pasta or curry"
        },
        {
          "mine": true,
          "text": "curry"
        },
        {
          "mine": false,
          "text": "see was that hard"
        }
      ]
    },
    {
      "name": "Ella ❤️",
      "messages": [
        {
          "mine": true,
          "text": "miss u"
        },
        {
          "mine": false,
          "text": "you saw me this morning lol"
        },
        {
          "mine": true,
          "text": "and?"
        },
        {
          "mine": false,
          "text": "soft"
        },
        {
          "mine": false,
          "text": "miss u too tho"
        },
        {
          "mine": true,
          "text": "knew it"
        }
      ]
    },
    {
      "name": "Grandma",
      "messages": [
        {
          "mine": false,
          "text": "Hello dear are you well"
        },
        {
          "mine": true,
          "text": "hi grandma yes im good x"
        },
        {
          "mine": false,
          "text": "Good. There is cake if you visit"
        },
        {
          "mine": true,
          "text": "say no more, sunday?"
        },
        {
          "mine": false,
          "text": "Lovely"
        }
      ]
    },
    {
      "name": "Nan",
      "messages": [
        {
          "mine": true,
          "text": "nan you good"
        },
        {
          "mine": false,
          "text": "who is this"
        },
        {
          "mine": true,
          "text": "its me nan lol its my number"
        },
        {
          "mine": false,
          "text": "oh hello love"
        },
        {
          "mine": false,
          "text": "put the kettle on when you come"
        }
      ]
    },
    {
      "name": "Jords flat",
      "messages": [
        {
          "mine": false,
          "text": "bins didnt go out"
        },
        {
          "mine": true,
          "text": "wasnt my week"
        },
        {
          "mine": false,
          "text": "it was"
        },
        {
          "mine": true,
          "text": "...ok it was"
        },
        {
          "mine": false,
          "text": "lol thought so"
        }
      ]
    },
    {
      "name": "the girls",
      "messages": [
        {
          "mine": false,
          "text": "brunch sat?"
        },
        {
          "mine": true,
          "text": "im in"
        },
        {
          "mine": false,
          "text": "me too but not too early"
        },
        {
          "mine": false,
          "text": "11?"
        },
        {
          "mine": true,
          "text": "11 is early for you now?"
        },
        {
          "mine": false,
          "text": "i had a big week"
        }
      ]
    },
    {
      "name": "flat",
      "messages": [
        {
          "mine": true,
          "text": "whos eaten my yogurt"
        },
        {
          "mine": false,
          "text": "wasnt me"
        },
        {
          "mine": false,
          "text": "wasnt me either"
        },
        {
          "mine": true,
          "text": "theres literally 3 of us"
        },
        {
          "mine": false,
          "text": "the ghost then"
        },
        {
          "mine": true,
          "text": "the ghost owes me a yogurt"
        }
      ]
    },
    {
      "name": "fam",
      "messages": [
        {
          "mine": false,
          "text": "whos coming sunday"
        },
        {
          "mine": true,
          "text": "me + ill bring pudding"
        },
        {
          "mine": false,
          "text": "i can do sat not sun"
        },
        {
          "mine": false,
          "text": "its sunday. always sunday"
        },
        {
          "mine": true,
          "text": "lol"
        }
      ]
    },
    {
      "name": "5-a-side",
      "messages": [
        {
          "mine": false,
          "text": "we short tonight?"
        },
        {
          "mine": true,
          "text": "im in"
        },
        {
          "mine": false,
          "text": "need one more"
        },
        {
          "mine": true,
          "text": "ill ask baz"
        },
        {
          "mine": false,
          "text": "if baz plays we lose"
        },
        {
          "mine": true,
          "text": "harsh but true"
        }
      ]
    },
    {
      "name": "book club",
      "messages": [
        {
          "mine": false,
          "text": "did anyone actually finish it"
        },
        {
          "mine": true,
          "text": "got to like ch 4"
        },
        {
          "mine": false,
          "text": "same lol"
        },
        {
          "mine": false,
          "text": "we can just wing it and drink wine"
        },
        {
          "mine": true,
          "text": "now thats a book club"
        }
      ]
    },
    {
      "name": "Tom",
      "messages": [
        {
          "mine": true,
          "text": "you free to help me move sat"
        },
        {
          "mine": false,
          "text": "how much stuff"
        },
        {
          "mine": true,
          "text": "not loads"
        },
        {
          "mine": false,
          "text": "you said that last time and it was a sofa up 4 floors"
        },
        {
          "mine": true,
          "text": "pizza on me"
        },
        {
          "mine": false,
          "text": "fine"
        }
      ]
    },
    {
      "name": "Katie",
      "messages": [
        {
          "mine": false,
          "text": "omg im so bored at work"
        },
        {
          "mine": true,
          "text": "same energy"
        },
        {
          "mine": false,
          "text": "entertain me"
        },
        {
          "mine": true,
          "text": "no"
        },
        {
          "mine": false,
          "text": "rude"
        }
      ]
    },
    {
      "name": "Ben",
      "messages": [
        {
          "mine": true,
          "text": "pub after?"
        },
        {
          "mine": false,
          "text": "cant, skint"
        },
        {
          "mine": true,
          "text": "ill get first round"
        },
        {
          "mine": false,
          "text": "why didnt u lead with that"
        },
        {
          "mine": true,
          "text": "see u at 6"
        }
      ]
    },
    {
      "name": "Sophie",
      "messages": [
        {
          "mine": false,
          "text": "you never replied to my message"
        },
        {
          "mine": true,
          "text": "which one"
        },
        {
          "mine": false,
          "text": "exactly"
        },
        {
          "mine": true,
          "text": "ok that ones on me sorry"
        },
        {
          "mine": false,
          "text": "redeemed"
        }
      ]
    },
    {
      "name": "Alex",
      "messages": [
        {
          "mine": false,
          "text": "wyd"
        },
        {
          "mine": true,
          "text": "nothing u"
        },
        {
          "mine": false,
          "text": "same"
        },
        {
          "mine": true,
          "text": "wanna do nothing together"
        },
        {
          "mine": false,
          "text": "ye come round"
        }
      ]
    },
    {
      "name": "Mia",
      "messages": [
        {
          "mine": true,
          "text": "did i leave my card at yours"
        },
        {
          "mine": false,
          "text": "checking"
        },
        {
          "mine": false,
          "text": "yep its on the side"
        },
        {
          "mine": true,
          "text": "omg thank god"
        },
        {
          "mine": false,
          "text": "you'd lose your head"
        }
      ]
    },
    {
      "name": "Josh",
      "messages": [
        {
          "mine": false,
          "text": "you watching the new season"
        },
        {
          "mine": true,
          "text": "no spoilers"
        },
        {
          "mine": false,
          "text": "i wasnt gonna"
        },
        {
          "mine": true,
          "text": "you were 100% gonna"
        },
        {
          "mine": false,
          "text": "...maybe"
        }
      ]
    },
    {
      "name": "Grace",
      "messages": [
        {
          "mine": false,
          "text": "can i borrow that black dress"
        },
        {
          "mine": true,
          "text": "which one"
        },
        {
          "mine": false,
          "text": "the one from lauras thing"
        },
        {
          "mine": true,
          "text": "ye but i want it back this time"
        },
        {
          "mine": false,
          "text": "THAT was one time"
        }
      ]
    },
    {
      "name": "Ryan",
      "messages": [
        {
          "mine": true,
          "text": "you at yours?"
        },
        {
          "mine": false,
          "text": "ye why"
        },
        {
          "mine": true,
          "text": "coming to grab my stuff"
        },
        {
          "mine": false,
          "text": "its by the door"
        },
        {
          "mine": true,
          "text": "nice ta"
        }
      ]
    },
    {
      "name": "Amy",
      "messages": [
        {
          "mine": false,
          "text": "i cant stop thinking about that pasta"
        },
        {
          "mine": true,
          "text": "the one from friday??"
        },
        {
          "mine": false,
          "text": "yes im obsessed"
        },
        {
          "mine": true,
          "text": "lets go back this week"
        },
        {
          "mine": false,
          "text": "say when"
        }
      ]
    },
    {
      "name": "Luke",
      "messages": [
        {
          "mine": false,
          "text": "mate my train is cancelled"
        },
        {
          "mine": true,
          "text": "course it is"
        },
        {
          "mine": false,
          "text": "gonna be late"
        },
        {
          "mine": true,
          "text": "ill save u a seat"
        },
        {
          "mine": false,
          "text": "ledge"
        }
      ]
    },
    {
      "name": "Hannah",
      "messages": [
        {
          "mine": true,
          "text": "you ok? you were quiet earlier"
        },
        {
          "mine": false,
          "text": "ye just tired"
        },
        {
          "mine": true,
          "text": "sure?"
        },
        {
          "mine": false,
          "text": "ye honestly. long week"
        },
        {
          "mine": true,
          "text": "call me later if u want"
        }
      ]
    },
    {
      "name": "Charlie",
      "messages": [
        {
          "mine": false,
          "text": "is it bring a plate or is food sorted"
        },
        {
          "mine": true,
          "text": "bring smth"
        },
        {
          "mine": false,
          "text": "defining something"
        },
        {
          "mine": true,
          "text": "crisps. bring crisps"
        },
        {
          "mine": false,
          "text": "i can do crisps"
        }
      ]
    },
    {
      "name": "Ruby",
      "messages": [
        {
          "mine": false,
          "text": "i did a Thing"
        },
        {
          "mine": true,
          "text": "what thing"
        },
        {
          "mine": false,
          "text": "i cut my own fringe"
        },
        {
          "mine": true,
          "text": "RUBY"
        },
        {
          "mine": false,
          "text": "its not bad!!"
        },
        {
          "mine": true,
          "text": "send a pic"
        },
        {
          "mine": false,
          "text": "...its bad"
        }
      ]
    },
    {
      "name": "Ollie",
      "messages": [
        {
          "mine": true,
          "text": "you get home ok"
        },
        {
          "mine": false,
          "text": "ye just in"
        },
        {
          "mine": true,
          "text": "good night was carnage"
        },
        {
          "mine": false,
          "text": "my head already hurts"
        },
        {
          "mine": true,
          "text": "lol worth it"
        }
      ]
    },
    {
      "name": "Megan",
      "messages": [
        {
          "mine": false,
          "text": "are we still on for tmrw or"
        },
        {
          "mine": true,
          "text": "ye course"
        },
        {
          "mine": false,
          "text": "ok just checking you went quiet"
        },
        {
          "mine": true,
          "text": "was asleep sorry"
        },
        {
          "mine": false,
          "text": "at 8pm??"
        },
        {
          "mine": true,
          "text": "i had a nap that got ambitious"
        }
      ]
    },
    {
      "name": "Jack",
      "messages": [
        {
          "mine": true,
          "text": "you seen my hoodie"
        },
        {
          "mine": false,
          "text": "the grey one? think its at mine"
        },
        {
          "mine": true,
          "text": "knew it"
        },
        {
          "mine": false,
          "text": "its basically mine now"
        },
        {
          "mine": true,
          "text": "absolutely not"
        }
      ]
    },
    {
      "name": "Freya",
      "messages": [
        {
          "mine": false,
          "text": "i have SO much to tell you"
        },
        {
          "mine": true,
          "text": "call me"
        },
        {
          "mine": false,
          "text": "cant rn im at work"
        },
        {
          "mine": true,
          "text": "freya you cant say that and leave"
        },
        {
          "mine": false,
          "text": "lunch. 1pm. be ready"
        }
      ]
    },
    {
      "name": "Harry",
      "messages": [
        {
          "mine": true,
          "text": "you bringing the speaker sat"
        },
        {
          "mine": false,
          "text": "ye"
        },
        {
          "mine": true,
          "text": "and the good one not the tiny one"
        },
        {
          "mine": false,
          "text": "the tiny one is a vibe"
        },
        {
          "mine": true,
          "text": "the tiny one is a phone on a cup"
        }
      ]
    },
    {
      "name": "Lucy",
      "messages": [
        {
          "mine": false,
          "text": "wine?"
        },
        {
          "mine": true,
          "text": "its a tuesday"
        },
        {
          "mine": false,
          "text": "and?"
        },
        {
          "mine": true,
          "text": "good point, red or white"
        },
        {
          "mine": false,
          "text": "yes"
        }
      ]
    },
    {
      "name": "George",
      "messages": [
        {
          "mine": false,
          "text": "did we book the table"
        },
        {
          "mine": true,
          "text": "i thought you did"
        },
        {
          "mine": false,
          "text": "george."
        },
        {
          "mine": true,
          "text": "on it now"
        },
        {
          "mine": false,
          "text": "for how many"
        },
        {
          "mine": true,
          "text": "good q ill ask the chat"
        }
      ]
    },
    {
      "name": "Daisy",
      "messages": [
        {
          "mine": true,
          "text": "happy monday i hate it here"
        },
        {
          "mine": false,
          "text": "lol strong start"
        },
        {
          "mine": true,
          "text": "5 more days"
        },
        {
          "mine": false,
          "text": "coffee at 11?"
        },
        {
          "mine": true,
          "text": "the only thing keeping me going"
        }
      ]
    },
    {
      "name": "Will",
      "messages": [
        {
          "mine": false,
          "text": "you playing sunday"
        },
        {
          "mine": true,
          "text": "ye think so"
        },
        {
          "mine": false,
          "text": "think or yes"
        },
        {
          "mine": true,
          "text": "yes"
        },
        {
          "mine": false,
          "text": "good we need you"
        }
      ]
    },
    {
      "name": "Isla",
      "messages": [
        {
          "mine": false,
          "text": "omg did you see her story"
        },
        {
          "mine": true,
          "text": "just did"
        },
        {
          "mine": false,
          "text": "the AUDACITY"
        },
        {
          "mine": true,
          "text": "i have no idea whats happening but yes"
        },
        {
          "mine": false,
          "text": "ill fill you in at lunch"
        }
      ]
    },
    {
      "name": "Adam",
      "messages": [
        {
          "mine": true,
          "text": "can you cover me sat i swap you"
        },
        {
          "mine": false,
          "text": "depends what im getting"
        },
        {
          "mine": true,
          "text": "my undying gratitude"
        },
        {
          "mine": false,
          "text": "and?"
        },
        {
          "mine": true,
          "text": "and next fri"
        },
        {
          "mine": false,
          "text": "deal"
        }
      ]
    },
    {
      "name": "Holly",
      "messages": [
        {
          "mine": false,
          "text": "i miss uni so bad rn"
        },
        {
          "mine": true,
          "text": "you hated uni"
        },
        {
          "mine": false,
          "text": "i hated the work not the naps"
        },
        {
          "mine": true,
          "text": "fair"
        },
        {
          "mine": false,
          "text": "adult life is a scam"
        }
      ]
    },
    {
      "name": "Nick",
      "messages": [
        {
          "mine": true,
          "text": "lunch spot?"
        },
        {
          "mine": false,
          "text": "the usual"
        },
        {
          "mine": true,
          "text": "we go there every day"
        },
        {
          "mine": false,
          "text": "and its good every day"
        },
        {
          "mine": true,
          "text": "cant argue"
        }
      ]
    },
    {
      "name": "Poppy",
      "messages": [
        {
          "mine": false,
          "text": "do you have plans this wknd or"
        },
        {
          "mine": true,
          "text": "nothing set"
        },
        {
          "mine": false,
          "text": "wanna do something"
        },
        {
          "mine": true,
          "text": "ye lets"
        },
        {
          "mine": false,
          "text": "ill think of smth"
        }
      ]
    },
    {
      "name": "Matt",
      "messages": [
        {
          "mine": true,
          "text": "bro your fantasy team is a disaster"
        },
        {
          "mine": false,
          "text": "leave me alone"
        },
        {
          "mine": true,
          "text": "minus 4 points"
        },
        {
          "mine": false,
          "text": "i know the number matt"
        },
        {
          "mine": true,
          "text": "just checking you knew"
        }
      ]
    },
    {
      "name": "Zoe",
      "messages": [
        {
          "mine": false,
          "text": "you around later"
        },
        {
          "mine": true,
          "text": "ye whats up"
        },
        {
          "mine": false,
          "text": "just wanna chat about smth"
        },
        {
          "mine": true,
          "text": "you good??"
        },
        {
          "mine": false,
          "text": "ye ye nothing bad promise"
        },
        {
          "mine": true,
          "text": "ok call whenever"
        }
      ]
    },
    {
      "name": "Dan",
      "messages": [
        {
          "mine": false,
          "text": "omw"
        },
        {
          "mine": true,
          "text": "you said that 20 min ago"
        },
        {
          "mine": false,
          "text": "omw-er"
        },
        {
          "mine": true,
          "text": "dan"
        },
        {
          "mine": false,
          "text": "literally leaving now"
        }
      ]
    },
    {
      "name": "Erin",
      "messages": [
        {
          "mine": true,
          "text": "what did we decide for lauras present"
        },
        {
          "mine": false,
          "text": "we didnt"
        },
        {
          "mine": true,
          "text": "of course we didnt"
        },
        {
          "mine": false,
          "text": "vouchers?"
        },
        {
          "mine": true,
          "text": "lazy but yes"
        },
        {
          "mine": false,
          "text": "efficient*"
        }
      ]
    },
    {
      "name": "Joe",
      "messages": [
        {
          "mine": false,
          "text": "you up for a run tmrw morning"
        },
        {
          "mine": true,
          "text": "how early we talking"
        },
        {
          "mine": false,
          "text": "7"
        },
        {
          "mine": true,
          "text": "absolutely not"
        },
        {
          "mine": false,
          "text": "8?"
        },
        {
          "mine": true,
          "text": "fine 8"
        }
      ]
    },
    {
      "name": "Lauren",
      "messages": [
        {
          "mine": false,
          "text": "i cant find my keys again"
        },
        {
          "mine": true,
          "text": "jacket pocket"
        },
        {
          "mine": false,
          "text": "...how"
        },
        {
          "mine": true,
          "text": "its always the jacket"
        },
        {
          "mine": false,
          "text": "youre a wizard"
        }
      ]
    },
    {
      "name": "Kai",
      "messages": [
        {
          "mine": true,
          "text": "you get the tickets?"
        },
        {
          "mine": false,
          "text": "ye 2 sorted"
        },
        {
          "mine": true,
          "text": "YES"
        },
        {
          "mine": false,
          "text": "you owe me for yours"
        },
        {
          "mine": true,
          "text": "ill get u back sat"
        }
      ]
    },
    {
      "name": "Molly",
      "messages": [
        {
          "mine": false,
          "text": "is it just me or is today dragging"
        },
        {
          "mine": true,
          "text": "its 11am"
        },
        {
          "mine": false,
          "text": "exactly"
        },
        {
          "mine": true,
          "text": "lmao"
        },
        {
          "mine": false,
          "text": "send help"
        }
      ]
    },
    {
      "name": "Rob",
      "messages": [
        {
          "mine": true,
          "text": "you free to look at my car thing"
        },
        {
          "mine": false,
          "text": "whats it doing"
        },
        {
          "mine": true,
          "text": "making a noise"
        },
        {
          "mine": false,
          "text": "what kind of noise"
        },
        {
          "mine": true,
          "text": "a bad one"
        },
        {
          "mine": false,
          "text": "very helpful. ill come round sun"
        }
      ]
    },
    {
      "name": "Tash",
      "messages": [
        {
          "mine": false,
          "text": "guess who texted me"
        },
        {
          "mine": true,
          "text": "no"
        },
        {
          "mine": false,
          "text": "YES"
        },
        {
          "mine": true,
          "text": "do not reply"
        },
        {
          "mine": false,
          "text": "i already did"
        },
        {
          "mine": true,
          "text": "tash we talked about this"
        }
      ]
    },
    {
      "name": "Leo",
      "messages": [
        {
          "mine": false,
          "text": "you left the group chat lol"
        },
        {
          "mine": true,
          "text": "it was 200 messages about a table"
        },
        {
          "mine": false,
          "text": "fair"
        },
        {
          "mine": false,
          "text": "ill add you back for the actual plan"
        },
        {
          "mine": true,
          "text": "appreciated"
        }
      ]
    },
    {
      "name": "Fern",
      "messages": [
        {
          "mine": true,
          "text": "soup weather today"
        },
        {
          "mine": false,
          "text": "obsessed with you saying that every autumn"
        },
        {
          "mine": true,
          "text": "its a tradition now"
        },
        {
          "mine": false,
          "text": "soup at mine friday?"
        },
        {
          "mine": true,
          "text": "tradition confirmed"
        }
      ]
    },
    {
      "name": "Marcus",
      "messages": [
        {
          "mine": false,
          "text": "gym at 6 or you bailing"
        },
        {
          "mine": true,
          "text": "6 works"
        },
        {
          "mine": false,
          "text": "ill believe it when i see you"
        },
        {
          "mine": true,
          "text": "harsh"
        },
        {
          "mine": false,
          "text": "accurate"
        }
      ]
    },
    {
      "name": "Bella",
      "messages": [
        {
          "mine": false,
          "text": "i have nothing to wear tonight"
        },
        {
          "mine": true,
          "text": "you have a whole wardrobe"
        },
        {
          "mine": false,
          "text": "nothing to wear*"
        },
        {
          "mine": true,
          "text": "the blue top"
        },
        {
          "mine": false,
          "text": "...actually yes"
        },
        {
          "mine": true,
          "text": "youre welcome"
        }
      ]
    },
    {
      "name": "Sean",
      "messages": [
        {
          "mine": true,
          "text": "you watching the match sat"
        },
        {
          "mine": false,
          "text": "ye at the pub"
        },
        {
          "mine": true,
          "text": "which one"
        },
        {
          "mine": false,
          "text": "the usual, get there early its packed"
        },
        {
          "mine": true,
          "text": "ill grab seats"
        }
      ]
    },
    {
      "name": "Niamh",
      "messages": [
        {
          "mine": false,
          "text": "can we move tmrw to like 2"
        },
        {
          "mine": true,
          "text": "ye np"
        },
        {
          "mine": false,
          "text": "ur a star sorry"
        },
        {
          "mine": true,
          "text": "all good"
        },
        {
          "mine": false,
          "text": "actually can we do 3"
        }
      ]
    },
    {
      "name": "Callum",
      "messages": [
        {
          "mine": true,
          "text": "lend us a tenner till fri"
        },
        {
          "mine": false,
          "text": "you still owe me from last fri"
        },
        {
          "mine": true,
          "text": "do i"
        },
        {
          "mine": false,
          "text": "you do"
        },
        {
          "mine": true,
          "text": "...lend us a fiver then"
        },
        {
          "mine": false,
          "text": "lmao no"
        }
      ]
    },
    {
      "name": "Jess",
      "messages": [
        {
          "mine": false,
          "text": "you seen my messages or ignoring me"
        },
        {
          "mine": true,
          "text": "was driving!"
        },
        {
          "mine": false,
          "text": "likely story"
        },
        {
          "mine": true,
          "text": "literally driving jess"
        },
        {
          "mine": false,
          "text": "fine forgiven"
        }
      ]
    },
    {
      "name": "Reece",
      "messages": [
        {
          "mine": false,
          "text": "you coming to five a side or not"
        },
        {
          "mine": true,
          "text": "ye put me down"
        },
        {
          "mine": false,
          "text": "boots?"
        },
        {
          "mine": true,
          "text": "got them"
        },
        {
          "mine": false,
          "text": "last time you turned up in vans"
        }
      ]
    },
    {
      "name": "Amber",
      "messages": [
        {
          "mine": true,
          "text": "i need a coffee and a nap and its 9am"
        },
        {
          "mine": false,
          "text": "big same"
        },
        {
          "mine": true,
          "text": "is it too early to go home"
        },
        {
          "mine": false,
          "text": "yes"
        },
        {
          "mine": true,
          "text": "tragic"
        }
      ]
    },
    {
      "name": "Theo",
      "messages": [
        {
          "mine": false,
          "text": "did the thing arrive"
        },
        {
          "mine": true,
          "text": "ye its here"
        },
        {
          "mine": false,
          "text": "can i grab it tmrw"
        },
        {
          "mine": true,
          "text": "ye ill be in after 6"
        },
        {
          "mine": false,
          "text": "safe"
        }
      ]
    },
    {
      "name": "Kayla",
      "messages": [
        {
          "mine": false,
          "text": "omg im crying at this video"
        },
        {
          "mine": true,
          "text": "send it"
        },
        {
          "mine": false,
          "text": "sent"
        },
        {
          "mine": true,
          "text": "...ok that got me"
        },
        {
          "mine": false,
          "text": "right?? i cant"
        }
      ]
    },
    {
      "name": "Aaron",
      "messages": [
        {
          "mine": true,
          "text": "you home? left my keys"
        },
        {
          "mine": false,
          "text": "nah out till late"
        },
        {
          "mine": true,
          "text": "ffs"
        },
        {
          "mine": false,
          "text": "spare is under the plant"
        },
        {
          "mine": true,
          "text": "lifesaver"
        }
      ]
    },
    {
      "name": "Steph",
      "messages": [
        {
          "mine": false,
          "text": "we still doing the thing sunday"
        },
        {
          "mine": true,
          "text": "what thing"
        },
        {
          "mine": false,
          "text": "the walk??"
        },
        {
          "mine": true,
          "text": "oh ye ye course"
        },
        {
          "mine": false,
          "text": "you forgot didnt you"
        },
        {
          "mine": true,
          "text": "a little"
        }
      ]
    },
    {
      "name": "Dev",
      "messages": [
        {
          "mine": false,
          "text": "lunch you in"
        },
        {
          "mine": true,
          "text": "ye starving"
        },
        {
          "mine": false,
          "text": "same, that place with the wraps?"
        },
        {
          "mine": true,
          "text": "say less omw"
        },
        {
          "mine": false,
          "text": "grab me one if ur first"
        }
      ]
    },
    {
      "name": "Gemma",
      "messages": [
        {
          "mine": false,
          "text": "i cant believe she said that to you"
        },
        {
          "mine": true,
          "text": "ikr"
        },
        {
          "mine": false,
          "text": "you should say smth"
        },
        {
          "mine": true,
          "text": "nah cant be bothered"
        },
        {
          "mine": false,
          "text": "the high road. respect"
        }
      ]
    },
    {
      "name": "Elliot",
      "messages": [
        {
          "mine": true,
          "text": "you bringing the tent or am i"
        },
        {
          "mine": false,
          "text": "thought you were"
        },
        {
          "mine": true,
          "text": "elliot we cant both not bring a tent"
        },
        {
          "mine": false,
          "text": "ill bring it ill bring it"
        },
        {
          "mine": true,
          "text": "and the pegs this time"
        }
      ]
    },
    {
      "name": "Priya",
      "messages": [
        {
          "mine": false,
          "text": "you free thurs eve"
        },
        {
          "mine": true,
          "text": "think so whats up"
        },
        {
          "mine": false,
          "text": "wanna try that new place"
        },
        {
          "mine": true,
          "text": "the ramen one? yes"
        },
        {
          "mine": false,
          "text": "booking for 7"
        }
      ]
    },
    {
      "name": "Finn",
      "messages": [
        {
          "mine": true,
          "text": "where are you"
        },
        {
          "mine": false,
          "text": "nearly there 2 min"
        },
        {
          "mine": true,
          "text": "you said that"
        },
        {
          "mine": false,
          "text": "i can SEE you"
        },
        {
          "mine": true,
          "text": "oh"
        }
      ]
    },
    {
      "name": "Maya",
      "messages": [
        {
          "mine": false,
          "text": "i think i failed that"
        },
        {
          "mine": true,
          "text": "you always say that then get a distinction"
        },
        {
          "mine": false,
          "text": "not this time"
        },
        {
          "mine": true,
          "text": "literally every time"
        },
        {
          "mine": false,
          "text": "...ok maybe"
        }
      ]
    },
    {
      "name": "Grandpa",
      "messages": [
        {
          "mine": false,
          "text": "How is the new job"
        },
        {
          "mine": true,
          "text": "good thanks grandpa, busy!"
        },
        {
          "mine": false,
          "text": "Good lad. Work hard"
        },
        {
          "mine": true,
          "text": "always do x"
        },
        {
          "mine": false,
          "text": "Come round for a brew"
        }
      ]
    },
    {
      "name": "Liam gym",
      "messages": [
        {
          "mine": false,
          "text": "pb today mate?"
        },
        {
          "mine": true,
          "text": "close, next week"
        },
        {
          "mine": false,
          "text": "spot me sat"
        },
        {
          "mine": true,
          "text": "ye 10?"
        },
        {
          "mine": false,
          "text": "10"
        }
      ]
    },
    {
      "name": "Ross flat",
      "messages": [
        {
          "mine": false,
          "text": "whos turn for loo roll"
        },
        {
          "mine": true,
          "text": "not it"
        },
        {
          "mine": false,
          "text": "you said that last time too"
        },
        {
          "mine": true,
          "text": "ill get it ill get it"
        },
        {
          "mine": false,
          "text": "legend"
        }
      ]
    },
    {
      "name": "Kirsty",
      "messages": [
        {
          "mine": true,
          "text": "you around this wknd"
        },
        {
          "mine": false,
          "text": "sat yes sun no"
        },
        {
          "mine": true,
          "text": "sat works, coffee?"
        },
        {
          "mine": false,
          "text": "ye that new place"
        },
        {
          "mine": true,
          "text": "11"
        }
      ]
    },
    {
      "name": "Owen",
      "messages": [
        {
          "mine": false,
          "text": "bro i overslept the whole morning"
        },
        {
          "mine": true,
          "text": "again"
        },
        {
          "mine": false,
          "text": "my alarm betrayed me"
        },
        {
          "mine": true,
          "text": "your alarm or you"
        },
        {
          "mine": false,
          "text": "we dont point fingers"
        }
      ]
    },
    {
      "name": "the lads",
      "messages": [
        {
          "mine": false,
          "text": "whos out sat"
        },
        {
          "mine": true,
          "text": "me"
        },
        {
          "mine": false,
          "text": "me"
        },
        {
          "mine": false,
          "text": "maybe, depends on the missus"
        },
        {
          "mine": true,
          "text": "say hi to your mum"
        },
        {
          "mine": false,
          "text": "lmao"
        }
      ]
    },
    {
      "name": "work chat",
      "messages": [
        {
          "mine": false,
          "text": "is the printer working for anyone"
        },
        {
          "mine": true,
          "text": "nope"
        },
        {
          "mine": false,
          "text": "cursed machine"
        },
        {
          "mine": true,
          "text": "try turning it off and on, the sacred ritual"
        },
        {
          "mine": false,
          "text": "tried it. it laughed at me"
        }
      ]
    },
    {
      "name": "Nina",
      "messages": [
        {
          "mine": false,
          "text": "you good? havent heard from u"
        },
        {
          "mine": true,
          "text": "ye sorry been mad busy"
        },
        {
          "mine": false,
          "text": "no worries just checking on u"
        },
        {
          "mine": true,
          "text": "ur the best, lets catch up soon"
        },
        {
          "mine": false,
          "text": "this wknd?"
        }
      ]
    },
    {
      "name": "Toby",
      "messages": [
        {
          "mine": true,
          "text": "did you take my phone charger"
        },
        {
          "mine": false,
          "text": "no"
        },
        {
          "mine": true,
          "text": "toby"
        },
        {
          "mine": false,
          "text": "...the white one?"
        },
        {
          "mine": true,
          "text": "TOBY"
        }
      ]
    },
    {
      "name": "Paige",
      "messages": [
        {
          "mine": false,
          "text": "i cant decide between the two"
        },
        {
          "mine": true,
          "text": "send both"
        },
        {
          "mine": false,
          "text": "sent"
        },
        {
          "mine": true,
          "text": "the first one 100%"
        },
        {
          "mine": false,
          "text": "you didnt even look"
        },
        {
          "mine": true,
          "text": "i did! the first one"
        }
      ]
    },
    {
      "name": "Cam",
      "messages": [
        {
          "mine": false,
          "text": "you finish that thing for tmrw"
        },
        {
          "mine": true,
          "text": "nearly, you?"
        },
        {
          "mine": false,
          "text": "not even started lol"
        },
        {
          "mine": true,
          "text": "cam its due at 9"
        },
        {
          "mine": false,
          "text": "i work best under pressure"
        }
      ]
    },
    {
      "name": "Bea",
      "messages": [
        {
          "mine": true,
          "text": "movie night fri?"
        },
        {
          "mine": false,
          "text": "yes who else"
        },
        {
          "mine": true,
          "text": "just us i think"
        },
        {
          "mine": false,
          "text": "even better, im bringing snacks"
        },
        {
          "mine": true,
          "text": "and the blanket"
        }
      ]
    },
    {
      "name": "Rhys",
      "messages": [
        {
          "mine": false,
          "text": "you left your jacket in my car"
        },
        {
          "mine": true,
          "text": "knew it was somewhere"
        },
        {
          "mine": false,
          "text": "ill drop it thurs"
        },
        {
          "mine": true,
          "text": "cheers pal"
        }
      ]
    },
    {
      "name": "Immy",
      "messages": [
        {
          "mine": false,
          "text": "pleaseee come tonight"
        },
        {
          "mine": true,
          "text": "im so tired imm"
        },
        {
          "mine": false,
          "text": "one drink"
        },
        {
          "mine": true,
          "text": "you always say one"
        },
        {
          "mine": false,
          "text": "...two"
        },
        {
          "mine": true,
          "text": "fine but im leaving by 11"
        }
      ]
    },
    {
      "name": "Jamie",
      "messages": [
        {
          "mine": true,
          "text": "you seen the new episode"
        },
        {
          "mine": false,
          "text": "not yet dont you dare"
        },
        {
          "mine": true,
          "text": "i wont i wont"
        },
        {
          "mine": false,
          "text": "i mean it jamie"
        },
        {
          "mine": true,
          "text": "lips sealed"
        }
      ]
    },
    {
      "name": "🐻",
      "messages": [
        {
          "mine": false,
          "text": "home soon?"
        },
        {
          "mine": true,
          "text": "20 min, want anything"
        },
        {
          "mine": false,
          "text": "just you"
        },
        {
          "mine": true,
          "text": "gross"
        },
        {
          "mine": false,
          "text": "and milk actually"
        },
        {
          "mine": true,
          "text": "knew there was a catch"
        }
      ]
    },
    {
      "name": "Sana",
      "messages": [
        {
          "mine": false,
          "text": "did you get my voice note"
        },
        {
          "mine": true,
          "text": "ye listening now"
        },
        {
          "mine": false,
          "text": "its long sorry"
        },
        {
          "mine": true,
          "text": "4 minutes sana"
        },
        {
          "mine": false,
          "text": "i had a lot to say"
        }
      ]
    },
    {
      "name": "Marnie",
      "messages": [
        {
          "mine": true,
          "text": "you free for a call later"
        },
        {
          "mine": false,
          "text": "ye after 8"
        },
        {
          "mine": true,
          "text": "perfect"
        },
        {
          "mine": false,
          "text": "everything ok?"
        },
        {
          "mine": true,
          "text": "ye just wanna chat properly"
        }
      ]
    },
    {
      "name": "Otis",
      "messages": [
        {
          "mine": false,
          "text": "you bringing your dog sat"
        },
        {
          "mine": true,
          "text": "course"
        },
        {
          "mine": false,
          "text": "good the kids will lose it"
        },
        {
          "mine": true,
          "text": "hes better behaved than me"
        },
        {
          "mine": false,
          "text": "low bar"
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
          "text": "has comido ya?"
        },
        {
          "mine": true,
          "text": "si ma acabo de comer"
        },
        {
          "mine": false,
          "text": "que has comido"
        },
        {
          "mine": true,
          "text": "pasta que me quedaba"
        },
        {
          "mine": false,
          "text": "otra vez pasta madre mia"
        },
        {
          "mine": false,
          "text": "el domingo te traes la ropa que te lavo"
        },
        {
          "mine": true,
          "text": "vale gracias 😘"
        }
      ]
    },
    {
      "name": "Papá",
      "messages": [
        {
          "mine": false,
          "text": "necesitas algo del super"
        },
        {
          "mine": true,
          "text": "leche si puedes"
        },
        {
          "mine": true,
          "text": "y pan"
        },
        {
          "mine": false,
          "text": "la entera o la desnatada"
        },
        {
          "mine": true,
          "text": "la de siempre pa"
        },
        {
          "mine": false,
          "text": "ok"
        }
      ]
    },
    {
      "name": "Abuela",
      "messages": [
        {
          "mine": false,
          "text": "hijo cuando vienes a verme"
        },
        {
          "mine": true,
          "text": "este finde me paso yaya"
        },
        {
          "mine": false,
          "text": "te hago croquetas"
        },
        {
          "mine": true,
          "text": "sii las tuyas son las mejores"
        },
        {
          "mine": false,
          "text": "come bien que estas muy flaco"
        }
      ]
    },
    {
      "name": "Yaya",
      "messages": [
        {
          "mine": true,
          "text": "yaya te llamo luego q ahora estoy liado"
        },
        {
          "mine": false,
          "text": "vale cariño"
        },
        {
          "mine": false,
          "text": "no trabajes tanto eh"
        },
        {
          "mine": true,
          "text": "jaja q va"
        },
        {
          "mine": false,
          "text": "un beso muy grande"
        }
      ]
    },
    {
      "name": "Yayo",
      "messages": [
        {
          "mine": false,
          "text": "gano el madrid ayer viste"
        },
        {
          "mine": true,
          "text": "siii que partidazo"
        },
        {
          "mine": false,
          "text": "ese chaval juega muy bien"
        },
        {
          "mine": true,
          "text": "el finde vemos otro juntos?"
        },
        {
          "mine": false,
          "text": "aqui te espero"
        }
      ]
    },
    {
      "name": "cariño",
      "messages": [
        {
          "mine": false,
          "text": "vienes a cenar o cenas por ahi"
        },
        {
          "mine": true,
          "text": "voy voy salgo ya"
        },
        {
          "mine": false,
          "text": "traes algo de picar?"
        },
        {
          "mine": true,
          "text": "cojo unas cervezas"
        },
        {
          "mine": false,
          "text": "y aceitunas porfa"
        },
        {
          "mine": true,
          "text": "hecho"
        },
        {
          "mine": false,
          "text": "tqm"
        }
      ]
    },
    {
      "name": "mi amor",
      "messages": [
        {
          "mine": true,
          "text": "te has dejado el cargador aqui"
        },
        {
          "mine": false,
          "text": "buah ya lo sabia"
        },
        {
          "mine": false,
          "text": "me lo traes mañana?"
        },
        {
          "mine": true,
          "text": "si tranqui"
        },
        {
          "mine": false,
          "text": "eres el mejor"
        }
      ]
    },
    {
      "name": "Elena ❤️",
      "messages": [
        {
          "mine": false,
          "text": "q haces"
        },
        {
          "mine": true,
          "text": "nada tirado en el sofa"
        },
        {
          "mine": false,
          "text": "me aburro"
        },
        {
          "mine": true,
          "text": "vente"
        },
        {
          "mine": false,
          "text": "en 20 estoy"
        }
      ]
    },
    {
      "name": "🐻",
      "messages": [
        {
          "mine": false,
          "text": "buenos dias"
        },
        {
          "mine": true,
          "text": "buenos dias dormilona"
        },
        {
          "mine": false,
          "text": "he soñado contigo jaja"
        },
        {
          "mine": true,
          "text": "ahh cuenta"
        },
        {
          "mine": false,
          "text": "luego te lo digo en persona"
        }
      ]
    },
    {
      "name": "Lucía",
      "messages": [
        {
          "mine": false,
          "text": "tia lo de ayer no me lo creo"
        },
        {
          "mine": true,
          "text": "lo se estoy flipando"
        },
        {
          "mine": false,
          "text": "y ella q dijo"
        },
        {
          "mine": true,
          "text": "nada se hizo la loca"
        },
        {
          "mine": false,
          "text": "no me jodas jajaja"
        }
      ]
    },
    {
      "name": "Javi",
      "messages": [
        {
          "mine": true,
          "text": "bajas a fumar"
        },
        {
          "mine": false,
          "text": "en 5"
        },
        {
          "mine": true,
          "text": "vale te espero abajo"
        },
        {
          "mine": false,
          "text": "voy voy"
        }
      ]
    },
    {
      "name": "Marta",
      "messages": [
        {
          "mine": false,
          "text": "al final que hacemos el sabado"
        },
        {
          "mine": true,
          "text": "nose me da pereza salir"
        },
        {
          "mine": false,
          "text": "peli en casa?"
        },
        {
          "mine": true,
          "text": "vale y pizza"
        },
        {
          "mine": false,
          "text": "hecho llevo yo el vino"
        }
      ]
    },
    {
      "name": "Dani",
      "messages": [
        {
          "mine": false,
          "text": "oye me dejaste el libro?"
        },
        {
          "mine": true,
          "text": "cual"
        },
        {
          "mine": false,
          "text": "el que te presté en enero xd"
        },
        {
          "mine": true,
          "text": "ostras es verdad mañana te lo llevo"
        },
        {
          "mine": false,
          "text": "jaja no corre"
        }
      ]
    },
    {
      "name": "Carlos",
      "messages": [
        {
          "mine": true,
          "text": "llegas?"
        },
        {
          "mine": false,
          "text": "saliendo del curro dame 15"
        },
        {
          "mine": true,
          "text": "vale voy pidiendo"
        },
        {
          "mine": false,
          "text": "una caña pa mi"
        }
      ]
    },
    {
      "name": "Manu",
      "messages": [
        {
          "mine": false,
          "text": "viste el video que te mande"
        },
        {
          "mine": true,
          "text": "jajajaja q fuerte"
        },
        {
          "mine": false,
          "text": "no puedo con el"
        },
        {
          "mine": true,
          "text": "me he meado literal"
        }
      ]
    },
    {
      "name": "Nando",
      "messages": [
        {
          "mine": true,
          "text": "quedamos pa entrenar mañana?"
        },
        {
          "mine": false,
          "text": "a que hora"
        },
        {
          "mine": true,
          "text": "8 antes de currar"
        },
        {
          "mine": false,
          "text": "buah muy pronto"
        },
        {
          "mine": true,
          "text": "flojo jaja"
        },
        {
          "mine": false,
          "text": "vale vale a las 8"
        }
      ]
    },
    {
      "name": "Pili",
      "messages": [
        {
          "mine": false,
          "text": "te acuerdas del sitio ese que fuimos"
        },
        {
          "mine": true,
          "text": "el de las tapas?"
        },
        {
          "mine": false,
          "text": "siii como se llamaba"
        },
        {
          "mine": true,
          "text": "ni idea pero estaba al lado de la plaza"
        },
        {
          "mine": false,
          "text": "vamos el jueves?"
        },
        {
          "mine": true,
          "text": "me apunto"
        }
      ]
    },
    {
      "name": "Rai",
      "messages": [
        {
          "mine": false,
          "text": "estas despierto"
        },
        {
          "mine": true,
          "text": "si q pasa"
        },
        {
          "mine": false,
          "text": "nada no podia dormir"
        },
        {
          "mine": true,
          "text": "yo igual xd"
        }
      ]
    },
    {
      "name": "Ana facu",
      "messages": [
        {
          "mine": false,
          "text": "entregaste ya el trabajo?"
        },
        {
          "mine": true,
          "text": "que va me falta la mitad"
        },
        {
          "mine": false,
          "text": "es para mañana tia"
        },
        {
          "mine": true,
          "text": "lo se lo se ayudame plis"
        },
        {
          "mine": false,
          "text": "vente a la biblio a las 4"
        },
        {
          "mine": true,
          "text": "alli estare"
        }
      ]
    },
    {
      "name": "Jordi piso",
      "messages": [
        {
          "mine": false,
          "text": "se ha acabado el papel higienico"
        },
        {
          "mine": true,
          "text": "otra vez? compre el finde pasado"
        },
        {
          "mine": false,
          "text": "pues vuela"
        },
        {
          "mine": true,
          "text": "compra tu esta vez anda"
        },
        {
          "mine": false,
          "text": "vale vale"
        }
      ]
    },
    {
      "name": "Max curro",
      "messages": [
        {
          "mine": false,
          "text": "has visto el mail del jefe"
        },
        {
          "mine": true,
          "text": "no q pone"
        },
        {
          "mine": false,
          "text": "reunion a las 5 buah"
        },
        {
          "mine": true,
          "text": "justo hoy q me queria pirar antes"
        },
        {
          "mine": false,
          "text": "ya ves"
        }
      ]
    },
    {
      "name": "Sara gym",
      "messages": [
        {
          "mine": true,
          "text": "vas hoy?"
        },
        {
          "mine": false,
          "text": "si sobre las 7"
        },
        {
          "mine": true,
          "text": "toca pierna?"
        },
        {
          "mine": false,
          "text": "si prepara las lagrimas jaja"
        },
        {
          "mine": true,
          "text": "buff"
        }
      ]
    },
    {
      "name": "piso",
      "messages": [
        {
          "mine": false,
          "text": "chicos quien ha dejado los platos sin fregar"
        },
        {
          "mine": true,
          "text": "yo no"
        },
        {
          "mine": false,
          "text": "yo tampoco"
        },
        {
          "mine": false,
          "text": "siempre es nadie eh"
        },
        {
          "mine": true,
          "text": "jajajaja el fantasma del piso"
        },
        {
          "mine": false,
          "text": "los frego yo pero mañana toca a otro"
        }
      ]
    },
    {
      "name": "familia",
      "messages": [
        {
          "mine": false,
          "text": "quien viene a comer el domingo"
        },
        {
          "mine": true,
          "text": "yo voy"
        },
        {
          "mine": false,
          "text": "nosotros tambien"
        },
        {
          "mine": false,
          "text": "hago paella entonces"
        },
        {
          "mine": true,
          "text": "bien mamá 🙌"
        },
        {
          "mine": false,
          "text": "a la una en punto no os retraseis"
        }
      ]
    },
    {
      "name": "las chicas",
      "messages": [
        {
          "mine": false,
          "text": "quien se apunta al finde a la playa"
        },
        {
          "mine": true,
          "text": "yoo"
        },
        {
          "mine": false,
          "text": "yo si consigo coche si"
        },
        {
          "mine": false,
          "text": "yo llevo la sombrilla"
        },
        {
          "mine": true,
          "text": "y yo la nevera"
        },
        {
          "mine": false,
          "text": "que ganas ya 🏖️"
        }
      ]
    },
    {
      "name": "fútbol",
      "messages": [
        {
          "mine": false,
          "text": "faltan 2 pa mañana"
        },
        {
          "mine": true,
          "text": "yo juego"
        },
        {
          "mine": false,
          "text": "yo tb pero llego tarde 10 min"
        },
        {
          "mine": false,
          "text": "seguimos siendo 9 eh"
        },
        {
          "mine": true,
          "text": "llamad a curro"
        },
        {
          "mine": false,
          "text": "ya le escribo"
        }
      ]
    },
    {
      "name": "cuadrilla",
      "messages": [
        {
          "mine": false,
          "text": "esta noche que"
        },
        {
          "mine": true,
          "text": "yo me apunto a lo que sea"
        },
        {
          "mine": false,
          "text": "empezamos en el bar de siempre?"
        },
        {
          "mine": false,
          "text": "a las 10 ahi"
        },
        {
          "mine": true,
          "text": "voy justo de las 10"
        },
        {
          "mine": false,
          "text": "vago"
        }
      ]
    },
    {
      "name": "Pablo",
      "messages": [
        {
          "mine": true,
          "text": "tio me has llamado?"
        },
        {
          "mine": false,
          "text": "si pero ya da igual"
        },
        {
          "mine": true,
          "text": "era importante?"
        },
        {
          "mine": false,
          "text": "nah luego te cuento"
        }
      ]
    },
    {
      "name": "Clara",
      "messages": [
        {
          "mine": false,
          "text": "estoy en tu portal"
        },
        {
          "mine": true,
          "text": "que? no me dijiste nada"
        },
        {
          "mine": false,
          "text": "sorpresa jaja baja"
        },
        {
          "mine": true,
          "text": "dame 2 min q estoy en pijama"
        },
        {
          "mine": false,
          "text": "corre"
        }
      ]
    },
    {
      "name": "Alba",
      "messages": [
        {
          "mine": false,
          "text": "me ha escrito el otra vez"
        },
        {
          "mine": true,
          "text": "no me digas y q quiere"
        },
        {
          "mine": false,
          "text": "hablar dice"
        },
        {
          "mine": true,
          "text": "no le contestes"
        },
        {
          "mine": false,
          "text": "ya lo se pero"
        },
        {
          "mine": true,
          "text": "nada de peros"
        }
      ]
    },
    {
      "name": "Nacho",
      "messages": [
        {
          "mine": true,
          "text": "queda birra en la nevera?"
        },
        {
          "mine": false,
          "text": "creo que una"
        },
        {
          "mine": true,
          "text": "es mia no la toques"
        },
        {
          "mine": false,
          "text": "tarde jaja"
        },
        {
          "mine": true,
          "text": "te mato"
        }
      ]
    },
    {
      "name": "Rocío",
      "messages": [
        {
          "mine": false,
          "text": "al final vienes a mi cumple no?"
        },
        {
          "mine": true,
          "text": "claro q si donde es"
        },
        {
          "mine": false,
          "text": "en mi casa a las 9"
        },
        {
          "mine": true,
          "text": "llevo algo?"
        },
        {
          "mine": false,
          "text": "solo tu bonita"
        }
      ]
    },
    {
      "name": "Guille",
      "messages": [
        {
          "mine": false,
          "text": "oye lo del sabado se cae"
        },
        {
          "mine": true,
          "text": "por"
        },
        {
          "mine": false,
          "text": "me ha surgido curro"
        },
        {
          "mine": true,
          "text": "vaya rollo"
        },
        {
          "mine": false,
          "text": "lo dejamos pa la semana q viene"
        }
      ]
    },
    {
      "name": "Irene",
      "messages": [
        {
          "mine": true,
          "text": "q tal la mudanza"
        },
        {
          "mine": false,
          "text": "muerta tia mil cajas"
        },
        {
          "mine": true,
          "text": "necesitas manos?"
        },
        {
          "mine": false,
          "text": "si vienes te invito a comer"
        },
        {
          "mine": true,
          "text": "voy en un rato"
        }
      ]
    },
    {
      "name": "Álvaro",
      "messages": [
        {
          "mine": false,
          "text": "has cogido tu las llaves?"
        },
        {
          "mine": true,
          "text": "no yo pense q tu"
        },
        {
          "mine": false,
          "text": "mierda"
        },
        {
          "mine": true,
          "text": "en serio nos hemos dejado fuera"
        },
        {
          "mine": false,
          "text": "llamo a mi madre q tiene copia"
        }
      ]
    },
    {
      "name": "Noe",
      "messages": [
        {
          "mine": false,
          "text": "peliii esta noche?"
        },
        {
          "mine": true,
          "text": "cual"
        },
        {
          "mine": false,
          "text": "la q me dijiste ayer"
        },
        {
          "mine": true,
          "text": "ah si vale palomitas puestas"
        }
      ]
    },
    {
      "name": "Vicky",
      "messages": [
        {
          "mine": true,
          "text": "donde estas q no te veo"
        },
        {
          "mine": false,
          "text": "al lado de la barra"
        },
        {
          "mine": true,
          "text": "hay mil personas jaja"
        },
        {
          "mine": false,
          "text": "camiseta roja levanto la mano"
        },
        {
          "mine": true,
          "text": "ya te veo voy"
        }
      ]
    },
    {
      "name": "Toni",
      "messages": [
        {
          "mine": false,
          "text": "me prestas el taladro?"
        },
        {
          "mine": true,
          "text": "si pasate cuando quieras"
        },
        {
          "mine": false,
          "text": "esta tarde?"
        },
        {
          "mine": true,
          "text": "guay estare en casa"
        }
      ]
    },
    {
      "name": "Bea",
      "messages": [
        {
          "mine": false,
          "text": "no sabes lo q me ha pasado hoy"
        },
        {
          "mine": true,
          "text": "q q q"
        },
        {
          "mine": false,
          "text": "me he encontrado 50 euros por la calle"
        },
        {
          "mine": true,
          "text": "no fastidies q suerte"
        },
        {
          "mine": false,
          "text": "invito yo el finde jaja"
        }
      ]
    },
    {
      "name": "Sergio",
      "messages": [
        {
          "mine": true,
          "text": "juegas esta noche online?"
        },
        {
          "mine": false,
          "text": "si conectate sobre las 10"
        },
        {
          "mine": true,
          "text": "hecho ranked?"
        },
        {
          "mine": false,
          "text": "va pero no te piques como ayer jaja"
        },
        {
          "mine": true,
          "text": "eso fue culpa tuya"
        }
      ]
    },
    {
      "name": "Marina",
      "messages": [
        {
          "mine": false,
          "text": "te has enterado de lo de laura?"
        },
        {
          "mine": true,
          "text": "no que ha pasado"
        },
        {
          "mine": false,
          "text": "lo dejo con el novio"
        },
        {
          "mine": true,
          "text": "buah en serio"
        },
        {
          "mine": false,
          "text": "te llamo y te cuento bien"
        }
      ]
    },
    {
      "name": "Rubén",
      "messages": [
        {
          "mine": false,
          "text": "sales hoy?"
        },
        {
          "mine": true,
          "text": "nah estoy reventado"
        },
        {
          "mine": false,
          "text": "aburrido"
        },
        {
          "mine": true,
          "text": "mañana si eh"
        },
        {
          "mine": false,
          "text": "eso dijiste ayer"
        }
      ]
    },
    {
      "name": "Cris",
      "messages": [
        {
          "mine": true,
          "text": "me guardas sitio en clase?"
        },
        {
          "mine": false,
          "text": "si pero corre q se llena"
        },
        {
          "mine": true,
          "text": "voy llegando 5 min"
        },
        {
          "mine": false,
          "text": "date prisa"
        }
      ]
    },
    {
      "name": "Adri",
      "messages": [
        {
          "mine": false,
          "text": "que tal la cita de ayer 👀"
        },
        {
          "mine": true,
          "text": "meh"
        },
        {
          "mine": false,
          "text": "solo meh?"
        },
        {
          "mine": true,
          "text": "hablaba solo de si mismo todo el rato"
        },
        {
          "mine": false,
          "text": "jajaja siguiente"
        }
      ]
    },
    {
      "name": "Laura curro",
      "messages": [
        {
          "mine": false,
          "text": "te vienes a comer fuera hoy?"
        },
        {
          "mine": true,
          "text": "vale q me apetece salir de aqui"
        },
        {
          "mine": false,
          "text": "el italiano de abajo?"
        },
        {
          "mine": true,
          "text": "perfecto a la 1 y media"
        }
      ]
    },
    {
      "name": "Fer",
      "messages": [
        {
          "mine": false,
          "text": "tio me dejas apuntes de mates"
        },
        {
          "mine": true,
          "text": "no fui a esa clase jaja"
        },
        {
          "mine": false,
          "text": "buah estamos apañados"
        },
        {
          "mine": true,
          "text": "pidele a marta ella si va"
        }
      ]
    },
    {
      "name": "Marta gym",
      "messages": [
        {
          "mine": true,
          "text": "cambio la clase de las 6 a las 8 te va?"
        },
        {
          "mine": false,
          "text": "si mejor asi me da tiempo"
        },
        {
          "mine": true,
          "text": "guay reservo pa las dos"
        },
        {
          "mine": false,
          "text": "gracias crack"
        }
      ]
    },
    {
      "name": "Diego",
      "messages": [
        {
          "mine": false,
          "text": "estas viendo el partido"
        },
        {
          "mine": true,
          "text": "si menudo robo el penalti"
        },
        {
          "mine": false,
          "text": "vergonzoso"
        },
        {
          "mine": true,
          "text": "el arbitro comprado total"
        }
      ]
    },
    {
      "name": "Andrea",
      "messages": [
        {
          "mine": true,
          "text": "me sale humo del ordenador ayudaaa"
        },
        {
          "mine": false,
          "text": "que? apagalo ya"
        },
        {
          "mine": true,
          "text": "vale ya esta"
        },
        {
          "mine": false,
          "text": "no lo enchufes hasta q lo mire"
        },
        {
          "mine": true,
          "text": "vale vente porfa"
        }
      ]
    },
    {
      "name": "Hugo",
      "messages": [
        {
          "mine": false,
          "text": "al final que pizza pedimos"
        },
        {
          "mine": true,
          "text": "barbacoa"
        },
        {
          "mine": false,
          "text": "otra vez? pedimos cuatro quesos"
        },
        {
          "mine": true,
          "text": "vale pero con extra de queso"
        },
        {
          "mine": false,
          "text": "obvio"
        }
      ]
    },
    {
      "name": "Paula",
      "messages": [
        {
          "mine": false,
          "text": "estoy en el tren ya voy pa alla"
        },
        {
          "mine": true,
          "text": "bien a q hora llegas"
        },
        {
          "mine": false,
          "text": "sobre las 6"
        },
        {
          "mine": true,
          "text": "te recojo en la estacion"
        },
        {
          "mine": false,
          "text": "graciasss"
        }
      ]
    },
    {
      "name": "Víctor",
      "messages": [
        {
          "mine": true,
          "text": "me has robado el cargador seguro"
        },
        {
          "mine": false,
          "text": "yo no eh"
        },
        {
          "mine": true,
          "text": "ya claro"
        },
        {
          "mine": false,
          "text": "mira en tu mochila anda"
        },
        {
          "mine": true,
          "text": "... estaba ahi jaja perdon"
        }
      ]
    },
    {
      "name": "Mireia",
      "messages": [
        {
          "mine": false,
          "text": "que color te gusta mas el azul o el verde"
        },
        {
          "mine": true,
          "text": "pa que"
        },
        {
          "mine": false,
          "text": "tu dime"
        },
        {
          "mine": true,
          "text": "azul"
        },
        {
          "mine": false,
          "text": "vale gracias jeje"
        }
      ]
    },
    {
      "name": "Quique",
      "messages": [
        {
          "mine": true,
          "text": "estas en casa?"
        },
        {
          "mine": false,
          "text": "no he salido a correr"
        },
        {
          "mine": true,
          "text": "vale te llamo luego"
        },
        {
          "mine": false,
          "text": "dame media hora"
        }
      ]
    },
    {
      "name": "Sofi",
      "messages": [
        {
          "mine": false,
          "text": "me encanta tu foto de perfil nueva"
        },
        {
          "mine": true,
          "text": "jaja gracias es de ayer"
        },
        {
          "mine": false,
          "text": "donde fue"
        },
        {
          "mine": true,
          "text": "en el mirador ese q te dije"
        },
        {
          "mine": false,
          "text": "tenemos q ir juntas"
        }
      ]
    },
    {
      "name": "Gonzalo",
      "messages": [
        {
          "mine": false,
          "text": "quedamos pa el trabajo de grupo cuando"
        },
        {
          "mine": true,
          "text": "mañana por la tarde?"
        },
        {
          "mine": false,
          "text": "vale a las 5 en la cafeteria"
        },
        {
          "mine": true,
          "text": "aviso a los demas"
        }
      ]
    },
    {
      "name": "Elsa",
      "messages": [
        {
          "mine": true,
          "text": "te dejaste la chaqueta en mi coche"
        },
        {
          "mine": false,
          "text": "buah menos mal"
        },
        {
          "mine": false,
          "text": "cuando me la das"
        },
        {
          "mine": true,
          "text": "mañana en clase"
        },
        {
          "mine": false,
          "text": "gracias"
        }
      ]
    },
    {
      "name": "Chema",
      "messages": [
        {
          "mine": false,
          "text": "vienes al concierto o q"
        },
        {
          "mine": true,
          "text": "cuanto valen las entradas"
        },
        {
          "mine": false,
          "text": "30 no esta mal"
        },
        {
          "mine": true,
          "text": "va me apunto compra dos"
        },
        {
          "mine": false,
          "text": "hecho"
        }
      ]
    },
    {
      "name": "Raquel",
      "messages": [
        {
          "mine": false,
          "text": "q hago de cena hoy no tengo ni idea"
        },
        {
          "mine": true,
          "text": "tortilla facil"
        },
        {
          "mine": false,
          "text": "no tengo huevos jaja"
        },
        {
          "mine": true,
          "text": "pues cereales xd"
        },
        {
          "mine": false,
          "text": "muy util gracias"
        }
      ]
    },
    {
      "name": "Iván",
      "messages": [
        {
          "mine": true,
          "text": "tio me han dado el curro!!"
        },
        {
          "mine": false,
          "text": "buah enhorabuena crack"
        },
        {
          "mine": false,
          "text": "hay q celebrarlo"
        },
        {
          "mine": true,
          "text": "el viernes invito yo"
        },
        {
          "mine": false,
          "text": "eso me gusta"
        }
      ]
    },
    {
      "name": "Lorena",
      "messages": [
        {
          "mine": false,
          "text": "estas ocupada?"
        },
        {
          "mine": true,
          "text": "un poco q pasa"
        },
        {
          "mine": false,
          "text": "nada cuando puedas llamame"
        },
        {
          "mine": true,
          "text": "en 10 min te va?"
        },
        {
          "mine": false,
          "text": "si perfecto"
        }
      ]
    },
    {
      "name": "Borja",
      "messages": [
        {
          "mine": false,
          "text": "he suspendido el examen tio"
        },
        {
          "mine": true,
          "text": "joder lo siento"
        },
        {
          "mine": false,
          "text": "por 2 puntos encima"
        },
        {
          "mine": true,
          "text": "en septiembre lo sacas seguro"
        },
        {
          "mine": false,
          "text": "eso espero"
        }
      ]
    },
    {
      "name": "Nuria",
      "messages": [
        {
          "mine": true,
          "text": "te has cortado el pelo?"
        },
        {
          "mine": false,
          "text": "siii se nota mucho?"
        },
        {
          "mine": true,
          "text": "te queda genial en serio"
        },
        {
          "mine": false,
          "text": "ayy gracias tenia dudas"
        }
      ]
    },
    {
      "name": "Edu",
      "messages": [
        {
          "mine": false,
          "text": "quedan sitios en el coche pa el finde?"
        },
        {
          "mine": true,
          "text": "si vamos 3 caben 2 mas"
        },
        {
          "mine": false,
          "text": "guay pues nos apuntamos"
        },
        {
          "mine": true,
          "text": "salimos a las 9 no lleguéis tarde"
        }
      ]
    },
    {
      "name": "Patri",
      "messages": [
        {
          "mine": false,
          "text": "me muero de sueño en el curro"
        },
        {
          "mine": true,
          "text": "cafe ya"
        },
        {
          "mine": false,
          "text": "voy por el tercero"
        },
        {
          "mine": true,
          "text": "jaja madre mia"
        }
      ]
    },
    {
      "name": "Óscar",
      "messages": [
        {
          "mine": true,
          "text": "bajas el balon?"
        },
        {
          "mine": false,
          "text": "si voy pa la cancha"
        },
        {
          "mine": true,
          "text": "avisa a los demas"
        },
        {
          "mine": false,
          "text": "ya estan viniendo"
        }
      ]
    },
    {
      "name": "Celia",
      "messages": [
        {
          "mine": false,
          "text": "te acuerdas q dia era la boda"
        },
        {
          "mine": true,
          "text": "el 12 creo"
        },
        {
          "mine": false,
          "text": "seguro? tengo q pedir dia"
        },
        {
          "mine": true,
          "text": "espera lo miro y te digo"
        },
        {
          "mine": false,
          "text": "porfa q me lio"
        }
      ]
    },
    {
      "name": "Marc",
      "messages": [
        {
          "mine": false,
          "text": "buenas tio como va"
        },
        {
          "mine": true,
          "text": "aqui liado y tu"
        },
        {
          "mine": false,
          "text": "igual jaja cuanto sin vernos"
        },
        {
          "mine": true,
          "text": "ya ni me acuerdo hay q quedar"
        },
        {
          "mine": false,
          "text": "esta semana sin falta"
        }
      ]
    },
    {
      "name": "Tania",
      "messages": [
        {
          "mine": true,
          "text": "me acompañas a comprar mañana?"
        },
        {
          "mine": false,
          "text": "a por que"
        },
        {
          "mine": true,
          "text": "necesito ropa pa la boda"
        },
        {
          "mine": false,
          "text": "uff shopping vale me apunto"
        },
        {
          "mine": true,
          "text": "bien a las 11 en el centro"
        }
      ]
    },
    {
      "name": "Isma",
      "messages": [
        {
          "mine": false,
          "text": "se me ha pinchado la rueda de la bici"
        },
        {
          "mine": true,
          "text": "vaya faena donde estas"
        },
        {
          "mine": false,
          "text": "cerca de tu casa"
        },
        {
          "mine": true,
          "text": "vente q tengo un kit"
        },
        {
          "mine": false,
          "text": "voy empujando gracias"
        }
      ]
    },
    {
      "name": "Miriam",
      "messages": [
        {
          "mine": false,
          "text": "vas a ir a clase hoy?"
        },
        {
          "mine": true,
          "text": "no me he quedado dormida"
        },
        {
          "mine": false,
          "text": "otra vez jaja"
        },
        {
          "mine": true,
          "text": "pasame los apuntes plis"
        },
        {
          "mine": false,
          "text": "vale pero me debes un cafe"
        }
      ]
    },
    {
      "name": "Aitor",
      "messages": [
        {
          "mine": true,
          "text": "llego 5 min tarde perdon"
        },
        {
          "mine": false,
          "text": "tranqui yo aun de camino"
        },
        {
          "mine": true,
          "text": "menos mal jaja"
        },
        {
          "mine": false,
          "text": "nos vemos ahi"
        }
      ]
    },
    {
      "name": "Carla",
      "messages": [
        {
          "mine": false,
          "text": "que sueño tengo hoy dios"
        },
        {
          "mine": true,
          "text": "yo igual no pego ojo ultimamente"
        },
        {
          "mine": false,
          "text": "nos hacemos mayores jaja"
        },
        {
          "mine": true,
          "text": "no me lo recuerdes"
        }
      ]
    },
    {
      "name": "Pepe",
      "messages": [
        {
          "mine": false,
          "text": "el sabado hacemos barbacoa en mi casa"
        },
        {
          "mine": true,
          "text": "bien ahi estare q llevo"
        },
        {
          "mine": false,
          "text": "trae chorizo y algo de beber"
        },
        {
          "mine": true,
          "text": "hecho a que hora"
        },
        {
          "mine": false,
          "text": "sobre las 2"
        }
      ]
    },
    {
      "name": "Silvia",
      "messages": [
        {
          "mine": true,
          "text": "has hablado con ella al final?"
        },
        {
          "mine": false,
          "text": "si lo arreglamos todo"
        },
        {
          "mine": true,
          "text": "menos mal me alegro un monton"
        },
        {
          "mine": false,
          "text": "gracias por el consejo de verdad"
        }
      ]
    },
    {
      "name": "Curro",
      "messages": [
        {
          "mine": false,
          "text": "juego mañana si o q"
        },
        {
          "mine": true,
          "text": "si porfa nos faltas tu"
        },
        {
          "mine": false,
          "text": "vale pero de portero no eh"
        },
        {
          "mine": true,
          "text": "jaja vale de defensa"
        }
      ]
    },
    {
      "name": "Naiara",
      "messages": [
        {
          "mine": false,
          "text": "he hecho bizcocho te guardo un trozo"
        },
        {
          "mine": true,
          "text": "sii de q es"
        },
        {
          "mine": false,
          "text": "de limon"
        },
        {
          "mine": true,
          "text": "mi favorito voy pa alla jaja"
        }
      ]
    },
    {
      "name": "Gabi",
      "messages": [
        {
          "mine": true,
          "text": "estas viendo la serie nueva?"
        },
        {
          "mine": false,
          "text": "voy por el 3"
        },
        {
          "mine": true,
          "text": "no me hagas spoiler porfa"
        },
        {
          "mine": false,
          "text": "tranqui pero el final buah"
        },
        {
          "mine": true,
          "text": "callateee"
        }
      ]
    },
    {
      "name": "Lidia",
      "messages": [
        {
          "mine": false,
          "text": "me han cancelado el vuelo"
        },
        {
          "mine": true,
          "text": "no me jodas y ahora q"
        },
        {
          "mine": false,
          "text": "me dan otro mañana"
        },
        {
          "mine": true,
          "text": "vaya marron lo siento"
        },
        {
          "mine": false,
          "text": "en fin a esperar"
        }
      ]
    },
    {
      "name": "Samu",
      "messages": [
        {
          "mine": false,
          "text": "tienes el cable ese hdmi?"
        },
        {
          "mine": true,
          "text": "creo q si pa q"
        },
        {
          "mine": false,
          "text": "pa la tele nueva"
        },
        {
          "mine": true,
          "text": "te lo llevo el finde"
        },
        {
          "mine": false,
          "text": "guay gracias"
        }
      ]
    },
    {
      "name": "Yaiza",
      "messages": [
        {
          "mine": true,
          "text": "que planazo hoy en serio"
        },
        {
          "mine": false,
          "text": "verdad q si me lo he pasado genial"
        },
        {
          "mine": false,
          "text": "repetimos pronto"
        },
        {
          "mine": true,
          "text": "sii mil veces"
        }
      ]
    },
    {
      "name": "Ismael",
      "messages": [
        {
          "mine": false,
          "text": "oye la reunion se ha movido a las 4"
        },
        {
          "mine": true,
          "text": "vale gracias por avisar"
        },
        {
          "mine": false,
          "text": "de nada, estas en tu sitio?"
        },
        {
          "mine": true,
          "text": "si voy pa alla ahora"
        }
      ]
    },
    {
      "name": "Ainhoa",
      "messages": [
        {
          "mine": false,
          "text": "tengo unas ganas de q sea finde"
        },
        {
          "mine": true,
          "text": "y yo buah"
        },
        {
          "mine": false,
          "text": "hacemos algo?"
        },
        {
          "mine": true,
          "text": "vamos a la sierra?"
        },
        {
          "mine": false,
          "text": "me encanta la idea"
        }
      ]
    },
    {
      "name": "Rodri",
      "messages": [
        {
          "mine": true,
          "text": "me has visto la cartera?"
        },
        {
          "mine": false,
          "text": "no la tenias en la mesa"
        },
        {
          "mine": true,
          "text": "pues ahora no esta"
        },
        {
          "mine": false,
          "text": "mira debajo del sofa siempre cae ahi"
        },
        {
          "mine": true,
          "text": "ostia si gracias"
        }
      ]
    },
    {
      "name": "Vero",
      "messages": [
        {
          "mine": false,
          "text": "estoy hecha polvo del trabajo"
        },
        {
          "mine": true,
          "text": "dia largo eh"
        },
        {
          "mine": false,
          "text": "no veas necesito vacaciones ya"
        },
        {
          "mine": true,
          "text": "cuantas te quedan"
        },
        {
          "mine": false,
          "text": "ni una jaja"
        }
      ]
    },
    {
      "name": "Kike",
      "messages": [
        {
          "mine": false,
          "text": "vas a sacar entradas pa el finde?"
        },
        {
          "mine": true,
          "text": "salen a las 10 estoy atento"
        },
        {
          "mine": false,
          "text": "avisa cuando esten y las pillo yo"
        },
        {
          "mine": true,
          "text": "vale te digo"
        }
      ]
    },
    {
      "name": "Judith",
      "messages": [
        {
          "mine": true,
          "text": "me ayudas con una cosa del ordenador?"
        },
        {
          "mine": false,
          "text": "claro q pasa"
        },
        {
          "mine": true,
          "text": "no me abre un archivo"
        },
        {
          "mine": false,
          "text": "mandamelo y lo miro"
        },
        {
          "mine": true,
          "text": "ya va gracias"
        }
      ]
    },
    {
      "name": "Mario",
      "messages": [
        {
          "mine": false,
          "text": "tio q partidazo el domingo eh"
        },
        {
          "mine": true,
          "text": "buah metimos 4"
        },
        {
          "mine": false,
          "text": "tu golazo del final loco"
        },
        {
          "mine": true,
          "text": "jaja salio de casualidad"
        },
        {
          "mine": false,
          "text": "eso dilo por ahi"
        }
      ]
    },
    {
      "name": "Estela",
      "messages": [
        {
          "mine": false,
          "text": "puedes venir un poco antes mañana?"
        },
        {
          "mine": true,
          "text": "a q hora"
        },
        {
          "mine": false,
          "text": "sobre las 10"
        },
        {
          "mine": true,
          "text": "vale sin problema"
        },
        {
          "mine": false,
          "text": "genial gracias"
        }
      ]
    },
    {
      "name": "Nando curro",
      "messages": [
        {
          "mine": false,
          "text": "te has traido el cargador del portatil?"
        },
        {
          "mine": true,
          "text": "si esta en mi mesa cogelo"
        },
        {
          "mine": false,
          "text": "gracias salvavidas"
        },
        {
          "mine": true,
          "text": "me lo dejas donde estaba luego"
        }
      ]
    },
    {
      "name": "Berta",
      "messages": [
        {
          "mine": true,
          "text": "estas de bajon?"
        },
        {
          "mine": false,
          "text": "un poco si"
        },
        {
          "mine": true,
          "text": "quieres q me pase"
        },
        {
          "mine": false,
          "text": "porfa"
        },
        {
          "mine": true,
          "text": "voy con helado"
        }
      ]
    },
    {
      "name": "Pau piso",
      "messages": [
        {
          "mine": false,
          "text": "toca pagar la luz este mes"
        },
        {
          "mine": true,
          "text": "cuanto sale"
        },
        {
          "mine": false,
          "text": "unos 40 cada uno"
        },
        {
          "mine": true,
          "text": "te lo paso esta noche"
        },
        {
          "mine": false,
          "text": "guay gracias"
        }
      ]
    },
    {
      "name": "Ariadna",
      "messages": [
        {
          "mine": false,
          "text": "que ganas de verte ya"
        },
        {
          "mine": true,
          "text": "y yo cuando vuelves"
        },
        {
          "mine": false,
          "text": "el jueves por fin"
        },
        {
          "mine": true,
          "text": "te recojo yo"
        },
        {
          "mine": false,
          "text": "🥰"
        }
      ]
    },
    {
      "name": "Josu",
      "messages": [
        {
          "mine": false,
          "text": "al monte el domingo?"
        },
        {
          "mine": true,
          "text": "cuanto es la ruta"
        },
        {
          "mine": false,
          "text": "unas 3 horas facil"
        },
        {
          "mine": true,
          "text": "va me apunto llevo bocatas"
        },
        {
          "mine": false,
          "text": "aupa"
        }
      ]
    },
    {
      "name": "Amaia",
      "messages": [
        {
          "mine": true,
          "text": "oye gracias por lo de ayer de verdad"
        },
        {
          "mine": false,
          "text": "nada mujer pa eso estamos"
        },
        {
          "mine": true,
          "text": "me salvaste"
        },
        {
          "mine": false,
          "text": "cuando quieras 😘"
        }
      ]
    },
    {
      "name": "cena de finde",
      "messages": [
        {
          "mine": false,
          "text": "donde reservamos al final"
        },
        {
          "mine": true,
          "text": "el japones estaba genial"
        },
        {
          "mine": false,
          "text": "voto japones"
        },
        {
          "mine": false,
          "text": "yo tb"
        },
        {
          "mine": true,
          "text": "reservo pa 6 a las 9?"
        },
        {
          "mine": false,
          "text": "perfecto"
        }
      ]
    },
    {
      "name": "Ale",
      "messages": [
        {
          "mine": false,
          "text": "me dejas la moto un momento?"
        },
        {
          "mine": true,
          "text": "pa q la necesitas"
        },
        {
          "mine": false,
          "text": "acercar una cosa aqui al lado"
        },
        {
          "mine": true,
          "text": "vale pero con cuidado eh"
        },
        {
          "mine": false,
          "text": "tranqui la traigo en nada"
        }
      ]
    },
    {
      "name": "Susana",
      "messages": [
        {
          "mine": false,
          "text": "has visto q han abierto una cafeteria nueva"
        },
        {
          "mine": true,
          "text": "no donde"
        },
        {
          "mine": false,
          "text": "al lado del parque"
        },
        {
          "mine": true,
          "text": "vamos a probarla el sabado?"
        },
        {
          "mine": false,
          "text": "hecho"
        }
      ]
    },
    {
      "name": "Marcos",
      "messages": [
        {
          "mine": true,
          "text": "te vienes a echar unas canastas?"
        },
        {
          "mine": false,
          "text": "ahora no puedo estoy con la comida"
        },
        {
          "mine": true,
          "text": "luego entonces"
        },
        {
          "mine": false,
          "text": "sobre las 6 si"
        },
        {
          "mine": true,
          "text": "guay ahi te veo"
        }
      ]
    },
    {
      "name": "roomies",
      "messages": [
        {
          "mine": false,
          "text": "quien se ha comido mi yogur"
        },
        {
          "mine": true,
          "text": "yo no juro"
        },
        {
          "mine": false,
          "text": "habia dos y no queda ninguno"
        },
        {
          "mine": true,
          "text": "pregunta a jordi"
        },
        {
          "mine": false,
          "text": "jordi???"
        },
        {
          "mine": true,
          "text": "jajaja se ha desconectado"
        }
      ]
    }
  ],
  "fr": [
    {
      "name": "Léa ❤️",
      "messages": [
        {
          "mine": false,
          "text": "t'es rentrée?"
        },
        {
          "mine": true,
          "text": "presque là dans le bus"
        },
        {
          "mine": false,
          "text": "ok je commande alors"
        },
        {
          "mine": true,
          "text": "ouii prends des nems stp"
        },
        {
          "mine": false,
          "text": "deja fait 😘"
        },
        {
          "mine": true,
          "text": "jt'aime"
        }
      ]
    },
    {
      "name": "Maman",
      "messages": [
        {
          "mine": false,
          "text": "tu passes dimanche?"
        },
        {
          "mine": true,
          "text": "jsp encore ptet le midi"
        },
        {
          "mine": false,
          "text": "dis moi avant que je fasse les courses"
        },
        {
          "mine": true,
          "text": "oui oui je te dis ce soir"
        },
        {
          "mine": false,
          "text": "prends ton frère si il veut venir"
        }
      ]
    },
    {
      "name": "Papa",
      "messages": [
        {
          "mine": false,
          "text": "t'as vu le match hier"
        },
        {
          "mine": true,
          "text": "nan j'ai raté jpp"
        },
        {
          "mine": false,
          "text": "on s'est fait démonter"
        },
        {
          "mine": true,
          "text": "mdr classique"
        },
        {
          "mine": false,
          "text": "la revanche dimanche prochain, viens"
        }
      ]
    },
    {
      "name": "Hugo",
      "messages": [
        {
          "mine": true,
          "text": "wsh tu fais qqch ce soir"
        },
        {
          "mine": false,
          "text": "nan rien pk"
        },
        {
          "mine": true,
          "text": "on se fait un ciné?"
        },
        {
          "mine": false,
          "text": "vas y ça marche 21h?"
        },
        {
          "mine": true,
          "text": "ok je prends les places"
        }
      ]
    },
    {
      "name": "Manon",
      "messages": [
        {
          "mine": false,
          "text": "j'ai un truc a te raconter"
        },
        {
          "mine": true,
          "text": "vas y"
        },
        {
          "mine": false,
          "text": "pas par message mdr"
        },
        {
          "mine": true,
          "text": "nan mais tu peux pas me faire ça"
        },
        {
          "mine": false,
          "text": "ce soir promis"
        },
        {
          "mine": true,
          "text": "jpp t'es relou"
        }
      ]
    },
    {
      "name": "Théo",
      "messages": [
        {
          "mine": true,
          "text": "t'as fini le taf?"
        },
        {
          "mine": false,
          "text": "presque il me reste un truc"
        },
        {
          "mine": true,
          "text": "on boit un coup après?"
        },
        {
          "mine": false,
          "text": "ouais 19h au bar habituel"
        },
        {
          "mine": true,
          "text": "top"
        }
      ]
    },
    {
      "name": "Camille",
      "messages": [
        {
          "mine": false,
          "text": "tu viens toujours demain"
        },
        {
          "mine": true,
          "text": "oui carrément"
        },
        {
          "mine": false,
          "text": "cool j'avais peur que tu flakes encore"
        },
        {
          "mine": true,
          "text": "eh oh une fois"
        },
        {
          "mine": false,
          "text": "deux fois"
        },
        {
          "mine": true,
          "text": "😅"
        }
      ]
    },
    {
      "name": "Manu",
      "messages": [
        {
          "mine": true,
          "text": "il est où mon chargeur"
        },
        {
          "mine": false,
          "text": "chez moi tu l'as oublié samedi"
        },
        {
          "mine": true,
          "text": "aaah ok je passe le prendre"
        },
        {
          "mine": false,
          "text": "tkt je te le ramène demain"
        }
      ]
    },
    {
      "name": "Flo",
      "messages": [
        {
          "mine": false,
          "text": "jsuis mort de rire"
        },
        {
          "mine": false,
          "text": "regarde ce que Théo a posté"
        },
        {
          "mine": true,
          "text": "mdrrr il assume rien"
        },
        {
          "mine": false,
          "text": "faut qu'on le charrie ce soir"
        },
        {
          "mine": true,
          "text": "grv"
        }
      ]
    },
    {
      "name": "Juju",
      "messages": [
        {
          "mine": true,
          "text": "tu bosses ce weekend?"
        },
        {
          "mine": false,
          "text": "samedi oui dimanche non"
        },
        {
          "mine": true,
          "text": "on se fait un brunch dimanche alors"
        },
        {
          "mine": false,
          "text": "ouiii j'ai trop faim rien qu'en y pensant"
        },
        {
          "mine": true,
          "text": "11h?"
        },
        {
          "mine": false,
          "text": "12h stp je dors"
        }
      ]
    },
    {
      "name": "Clem",
      "messages": [
        {
          "mine": false,
          "text": "t'as les notes du cours de hier"
        },
        {
          "mine": true,
          "text": "ouais je t'envoie"
        },
        {
          "mine": false,
          "text": "merci tu me sauves"
        },
        {
          "mine": true,
          "text": "tu me dois un café"
        },
        {
          "mine": false,
          "text": "deal"
        }
      ]
    },
    {
      "name": "Anna fac",
      "messages": [
        {
          "mine": false,
          "text": "la partiel c'est bien lundi?"
        },
        {
          "mine": true,
          "text": "nan mardi"
        },
        {
          "mine": false,
          "text": "ah ouf j'ai cru j'allais mourir"
        },
        {
          "mine": true,
          "text": "mdr révise quand même"
        },
        {
          "mine": false,
          "text": "jsp par où commencer jpp"
        }
      ]
    },
    {
      "name": "Jordan coloc",
      "messages": [
        {
          "mine": true,
          "text": "y'a plus de PQ"
        },
        {
          "mine": false,
          "text": "encore?? c'est toujours toi qui l'utilises"
        },
        {
          "mine": true,
          "text": "n'importe quoi"
        },
        {
          "mine": false,
          "text": "j'en prends en rentrant"
        },
        {
          "mine": true,
          "text": "prends du lait aussi stp"
        }
      ]
    },
    {
      "name": "Max taf",
      "messages": [
        {
          "mine": false,
          "text": "le boss a demandé le rapport"
        },
        {
          "mine": true,
          "text": "jle finis là je l'envoie dans 1h"
        },
        {
          "mine": false,
          "text": "ok je couvre si il repasse"
        },
        {
          "mine": true,
          "text": "t'es le meilleur"
        },
        {
          "mine": false,
          "text": "je sais"
        }
      ]
    },
    {
      "name": "Sarah muscu",
      "messages": [
        {
          "mine": true,
          "text": "t'y vas ce soir?"
        },
        {
          "mine": false,
          "text": "ouais 18h30"
        },
        {
          "mine": true,
          "text": "ok on fait jambes?"
        },
        {
          "mine": false,
          "text": "nan pitié j'ai encore mal de mardi"
        },
        {
          "mine": true,
          "text": "faible"
        },
        {
          "mine": false,
          "text": "mdr"
        }
      ]
    },
    {
      "name": "Mamie",
      "messages": [
        {
          "mine": false,
          "text": "tu manges bien au moins?"
        },
        {
          "mine": true,
          "text": "oui mamie tkt"
        },
        {
          "mine": false,
          "text": "c'est quoi tkt"
        },
        {
          "mine": true,
          "text": "ça veut dire t'inquiète pas 😂"
        },
        {
          "mine": false,
          "text": "ah. je t'ai fait un gâteau viens le chercher"
        }
      ]
    },
    {
      "name": "Papi",
      "messages": [
        {
          "mine": false,
          "text": "passe me voir j'ai un truc pour toi"
        },
        {
          "mine": true,
          "text": "ah oui quoi?"
        },
        {
          "mine": false,
          "text": "surprise"
        },
        {
          "mine": true,
          "text": "papi dis moi"
        },
        {
          "mine": false,
          "text": "viens et tu verras"
        }
      ]
    },
    {
      "name": "chéri",
      "messages": [
        {
          "mine": true,
          "text": "tu rentres à quelle heure"
        },
        {
          "mine": false,
          "text": "vers 20h ça va?"
        },
        {
          "mine": true,
          "text": "oui je fais à manger"
        },
        {
          "mine": false,
          "text": "t'es parfait je t'aime"
        },
        {
          "mine": true,
          "text": "pareil ❤️"
        }
      ]
    },
    {
      "name": "mon coeur",
      "messages": [
        {
          "mine": false,
          "text": "tu me manques"
        },
        {
          "mine": true,
          "text": "toi aussi bébé"
        },
        {
          "mine": false,
          "text": "encore 2 jours"
        },
        {
          "mine": true,
          "text": "j'ai hâte"
        },
        {
          "mine": false,
          "text": "❤️❤️"
        }
      ]
    },
    {
      "name": "🐻",
      "messages": [
        {
          "mine": true,
          "text": "debout marmotte"
        },
        {
          "mine": false,
          "text": "nannn 5 min"
        },
        {
          "mine": true,
          "text": "tu dis ça depuis 30 min"
        },
        {
          "mine": false,
          "text": "okok j'me lève"
        },
        {
          "mine": true,
          "text": "café prêt en bas"
        }
      ]
    },
    {
      "name": "les filles",
      "messages": [
        {
          "mine": false,
          "text": "on fait quoi samedi soir?"
        },
        {
          "mine": false,
          "text": "resto? soirée?"
        },
        {
          "mine": true,
          "text": "resto puis on avise"
        },
        {
          "mine": false,
          "text": "ok je réserve pour 4"
        },
        {
          "mine": false,
          "text": "on est 5 avec Chloé"
        },
        {
          "mine": true,
          "text": "ah oui vrai, 5"
        }
      ]
    },
    {
      "name": "coloc",
      "messages": [
        {
          "mine": false,
          "text": "qui a mangé mes restes"
        },
        {
          "mine": true,
          "text": "pas moi"
        },
        {
          "mine": false,
          "text": "y'avait des pâtes dans le frigo"
        },
        {
          "mine": true,
          "text": "ah. ça ptet moi"
        },
        {
          "mine": false,
          "text": "jle savais"
        }
      ]
    },
    {
      "name": "famille",
      "messages": [
        {
          "mine": false,
          "text": "rdv dimanche 12h chez mamie"
        },
        {
          "mine": true,
          "text": "ok noté"
        },
        {
          "mine": false,
          "text": "qui ramène le dessert?"
        },
        {
          "mine": true,
          "text": "moi je prends une tarte"
        },
        {
          "mine": false,
          "text": "parfait merci"
        }
      ]
    },
    {
      "name": "foot",
      "messages": [
        {
          "mine": false,
          "text": "match dimanche 10h, tout le monde là?"
        },
        {
          "mine": true,
          "text": "présent"
        },
        {
          "mine": false,
          "text": "il manque un gardien"
        },
        {
          "mine": true,
          "text": "demande à Nico il joue jamais mdr"
        },
        {
          "mine": false,
          "text": "nico?"
        },
        {
          "mine": true,
          "text": "lol"
        }
      ]
    },
    {
      "name": "la team",
      "messages": [
        {
          "mine": false,
          "text": "soirée chez qui vendredi"
        },
        {
          "mine": true,
          "text": "chez moi si vous voulez"
        },
        {
          "mine": false,
          "text": "go, j'ramène à boire"
        },
        {
          "mine": true,
          "text": "cool prévoyez à manger aussi"
        },
        {
          "mine": false,
          "text": "pizza commandée d'avance ez"
        }
      ]
    },
    {
      "name": "Nico",
      "messages": [
        {
          "mine": true,
          "text": "t'es où"
        },
        {
          "mine": false,
          "text": "jarrive 5 min"
        },
        {
          "mine": true,
          "text": "tu dis ça depuis 20 min mdr"
        },
        {
          "mine": false,
          "text": "non là pour de vrai"
        },
        {
          "mine": true,
          "text": "mouais"
        }
      ]
    },
    {
      "name": "Lucas",
      "messages": [
        {
          "mine": false,
          "text": "tu m'as pas rappelé"
        },
        {
          "mine": true,
          "text": "merde désolé j'ai zappé"
        },
        {
          "mine": false,
          "text": "c'est pas grave t'es dispo là?"
        },
        {
          "mine": true,
          "text": "oui vas y appelle"
        }
      ]
    },
    {
      "name": "Emma",
      "messages": [
        {
          "mine": true,
          "text": "tu fais quoi"
        },
        {
          "mine": false,
          "text": "rien je m'ennuie"
        },
        {
          "mine": true,
          "text": "pareil"
        },
        {
          "mine": false,
          "text": "on se fait un truc?"
        },
        {
          "mine": true,
          "text": "vas y viens chez moi"
        }
      ]
    },
    {
      "name": "Chloé",
      "messages": [
        {
          "mine": false,
          "text": "j'ai trop rien à me mettre"
        },
        {
          "mine": true,
          "text": "mets la robe noire"
        },
        {
          "mine": false,
          "text": "trop habillée pour un bar non?"
        },
        {
          "mine": true,
          "text": "jean + le petit top alors"
        },
        {
          "mine": false,
          "text": "ouais ok merci"
        }
      ]
    },
    {
      "name": "Enzo",
      "messages": [
        {
          "mine": true,
          "text": "wsh ça dit quoi"
        },
        {
          "mine": false,
          "text": "tranquille et toi"
        },
        {
          "mine": true,
          "text": "oklm, on se voit quand"
        },
        {
          "mine": false,
          "text": "cette semaine grv, jeudi?"
        },
        {
          "mine": true,
          "text": "jeudi ça marche"
        }
      ]
    },
    {
      "name": "Louis",
      "messages": [
        {
          "mine": false,
          "text": "t'as vu l'heure il est trop tard"
        },
        {
          "mine": true,
          "text": "ouais je dors dans 2 min"
        },
        {
          "mine": false,
          "text": "pareil bonne nuit"
        },
        {
          "mine": true,
          "text": "nuit 😴"
        }
      ]
    },
    {
      "name": "Jade",
      "messages": [
        {
          "mine": false,
          "text": "tu me prêtes ta veste pour samedi?"
        },
        {
          "mine": true,
          "text": "laquelle"
        },
        {
          "mine": false,
          "text": "la beige"
        },
        {
          "mine": true,
          "text": "ok mais rends la propre cette fois"
        },
        {
          "mine": false,
          "text": "mdr promis"
        }
      ]
    },
    {
      "name": "Gabriel",
      "messages": [
        {
          "mine": true,
          "text": "on révise ensemble demain?"
        },
        {
          "mine": false,
          "text": "ouais biblio 14h?"
        },
        {
          "mine": true,
          "text": "parfait"
        },
        {
          "mine": false,
          "text": "prends tes fiches j'ai rien compris au chap 3"
        }
      ]
    },
    {
      "name": "Inès",
      "messages": [
        {
          "mine": false,
          "text": "tu viens à l'anniv de Théo?"
        },
        {
          "mine": true,
          "text": "c'est quand déjà"
        },
        {
          "mine": false,
          "text": "samedi prochain"
        },
        {
          "mine": true,
          "text": "ah oui je viens on prend un cadeau ensemble?"
        },
        {
          "mine": false,
          "text": "oui go, jsp quoi par contre"
        }
      ]
    },
    {
      "name": "Raph",
      "messages": [
        {
          "mine": true,
          "text": "t'as ramené mon jeu?"
        },
        {
          "mine": false,
          "text": "ah merde non je l'ai oublié"
        },
        {
          "mine": true,
          "text": "la prochaine fois stp ça fait 3 semaines"
        },
        {
          "mine": false,
          "text": "oui oui juré"
        }
      ]
    },
    {
      "name": "Antoine",
      "messages": [
        {
          "mine": false,
          "text": "café demain matin avant le taf?"
        },
        {
          "mine": true,
          "text": "ouais 8h au coin?"
        },
        {
          "mine": false,
          "text": "parfait"
        },
        {
          "mine": true,
          "text": "j'ai besoin de caféine grv"
        }
      ]
    },
    {
      "name": "Marius",
      "messages": [
        {
          "mine": true,
          "text": "tu regardes la série?"
        },
        {
          "mine": false,
          "text": "ouais j'en suis à l'épisode 4"
        },
        {
          "mine": true,
          "text": "attends moi spoile pas"
        },
        {
          "mine": false,
          "text": "tkt je dis rien"
        }
      ]
    },
    {
      "name": "Océane",
      "messages": [
        {
          "mine": false,
          "text": "jsuis dégoutée"
        },
        {
          "mine": true,
          "text": "quoi encore"
        },
        {
          "mine": false,
          "text": "j'ai loupé mon train"
        },
        {
          "mine": true,
          "text": "mdr classique toi"
        },
        {
          "mine": false,
          "text": "c'est pas drôle le prochain est dans 1h"
        }
      ]
    },
    {
      "name": "Quentin",
      "messages": [
        {
          "mine": true,
          "text": "on se fait un padel dimanche?"
        },
        {
          "mine": false,
          "text": "ouais si il pleut pas"
        },
        {
          "mine": true,
          "text": "réserve à 15h je regarde la météo"
        },
        {
          "mine": false,
          "text": "ok"
        }
      ]
    },
    {
      "name": "Mathis",
      "messages": [
        {
          "mine": false,
          "text": "t'as les clés?"
        },
        {
          "mine": true,
          "text": "non c'est toi qui les avais"
        },
        {
          "mine": false,
          "text": "merde"
        },
        {
          "mine": true,
          "text": "cherche bien dans ta veste"
        },
        {
          "mine": false,
          "text": "ah trouvé 😅"
        }
      ]
    },
    {
      "name": "Lola",
      "messages": [
        {
          "mine": true,
          "text": "trop cute ton chat sur la story"
        },
        {
          "mine": false,
          "text": "mdr il fait que dormir"
        },
        {
          "mine": true,
          "text": "la vie de rêve"
        },
        {
          "mine": false,
          "text": "grv j'échange direct"
        }
      ]
    },
    {
      "name": "Baptiste",
      "messages": [
        {
          "mine": false,
          "text": "on part à quelle heure demain"
        },
        {
          "mine": true,
          "text": "tôt genre 7h la route est longue"
        },
        {
          "mine": false,
          "text": "7h aïe ok"
        },
        {
          "mine": true,
          "text": "dors bien tu conduis au retour"
        },
        {
          "mine": false,
          "text": "quoi non mdr"
        }
      ]
    },
    {
      "name": "Elsa",
      "messages": [
        {
          "mine": false,
          "text": "tu m'as vue nulle part hein"
        },
        {
          "mine": true,
          "text": "???"
        },
        {
          "mine": false,
          "text": "j'ai fait une bourde au taf"
        },
        {
          "mine": true,
          "text": "raconte"
        },
        {
          "mine": false,
          "text": "trop la honte je te dis ce soir"
        }
      ]
    },
    {
      "name": "Romain",
      "messages": [
        {
          "mine": true,
          "text": "partie ce soir?"
        },
        {
          "mine": false,
          "text": "ouais je me co vers 21h"
        },
        {
          "mine": true,
          "text": "ez on va perdre encore"
        },
        {
          "mine": false,
          "text": "mdr optimiste"
        }
      ]
    },
    {
      "name": "Alice",
      "messages": [
        {
          "mine": false,
          "text": "tu passes à la boulangerie?"
        },
        {
          "mine": true,
          "text": "oui tu veux quoi"
        },
        {
          "mine": false,
          "text": "une baguette et un croissant stp"
        },
        {
          "mine": true,
          "text": "ok"
        },
        {
          "mine": false,
          "text": "merci t'es un ange"
        }
      ]
    },
    {
      "name": "Paul",
      "messages": [
        {
          "mine": true,
          "text": "wsh t'as bien dormi"
        },
        {
          "mine": false,
          "text": "pas trop et toi"
        },
        {
          "mine": true,
          "text": "pareil nuit pourrie"
        },
        {
          "mine": false,
          "text": "café double aujourd'hui"
        }
      ]
    },
    {
      "name": "Margaux",
      "messages": [
        {
          "mine": false,
          "text": "il t'a répondu?"
        },
        {
          "mine": true,
          "text": "toujours pas"
        },
        {
          "mine": false,
          "text": "laisse tomber c'est un boulet"
        },
        {
          "mine": true,
          "text": "jsp j'attends encore un peu"
        },
        {
          "mine": false,
          "text": "tu mérites mieux"
        }
      ]
    },
    {
      "name": "Val",
      "messages": [
        {
          "mine": true,
          "text": "tu viens courir demain matin?"
        },
        {
          "mine": false,
          "text": "jsp j'ai la flemme d'avance"
        },
        {
          "mine": true,
          "text": "allez motive toi"
        },
        {
          "mine": false,
          "text": "okok 8h mais tu me réveilles"
        }
      ]
    },
    {
      "name": "Seb",
      "messages": [
        {
          "mine": false,
          "text": "t'as payé pour la cagnotte?"
        },
        {
          "mine": true,
          "text": "ah non j'ai oublié je fais ça"
        },
        {
          "mine": false,
          "text": "go on doit clôturer ce soir"
        },
        {
          "mine": true,
          "text": "c'est bon envoyé"
        }
      ]
    },
    {
      "name": "Noé",
      "messages": [
        {
          "mine": true,
          "text": "tu bosses où déjà"
        },
        {
          "mine": false,
          "text": "toujours au même endroit pk"
        },
        {
          "mine": true,
          "text": "je passe dans le coin on déjeune?"
        },
        {
          "mine": false,
          "text": "ouais 12h30 ça me va"
        }
      ]
    },
    {
      "name": "Lisa",
      "messages": [
        {
          "mine": false,
          "text": "jsuis trop fatiguée cette semaine"
        },
        {
          "mine": true,
          "text": "pareil vivement le weekend"
        },
        {
          "mine": false,
          "text": "on fait rien samedi hein"
        },
        {
          "mine": true,
          "text": "rien du tout, canapé série"
        },
        {
          "mine": false,
          "text": "parfait"
        }
      ]
    },
    {
      "name": "Yanis",
      "messages": [
        {
          "mine": true,
          "text": "wsh tu ramènes la manette?"
        },
        {
          "mine": false,
          "text": "ouais et les chips"
        },
        {
          "mine": true,
          "text": "le sang"
        },
        {
          "mine": false,
          "text": "prévois à boire toi"
        }
      ]
    },
    {
      "name": "Sofiane",
      "messages": [
        {
          "mine": false,
          "text": "t'as vu le prix des places"
        },
        {
          "mine": true,
          "text": "ouais c'est abusé"
        },
        {
          "mine": false,
          "text": "on y va quand même?"
        },
        {
          "mine": true,
          "text": "jsp ça pique"
        },
        {
          "mine": false,
          "text": "une fois dans la vie allez"
        }
      ]
    },
    {
      "name": "Amine",
      "messages": [
        {
          "mine": true,
          "text": "on se capte ce soir?"
        },
        {
          "mine": false,
          "text": "jpeux pas je suis crevé"
        },
        {
          "mine": true,
          "text": "oklm demain alors"
        },
        {
          "mine": false,
          "text": "ouais demain grv"
        }
      ]
    },
    {
      "name": "Mehdi",
      "messages": [
        {
          "mine": false,
          "text": "t'es passé où hier soir"
        },
        {
          "mine": true,
          "text": "jsuis rentré tôt j'étais mort"
        },
        {
          "mine": false,
          "text": "petit joueur"
        },
        {
          "mine": true,
          "text": "mdr next time"
        }
      ]
    },
    {
      "name": "Wassim",
      "messages": [
        {
          "mine": true,
          "text": "tu m'aides à déménager samedi?"
        },
        {
          "mine": false,
          "text": "ah ouais combien de cartons"
        },
        {
          "mine": true,
          "text": "genre 15 et un canapé"
        },
        {
          "mine": false,
          "text": "le canapé jpp mais ok"
        },
        {
          "mine": true,
          "text": "je paye la pizza"
        }
      ]
    },
    {
      "name": "Kevin taf",
      "messages": [
        {
          "mine": false,
          "text": "réunion décalée à 15h"
        },
        {
          "mine": true,
          "text": "ah cool j'ai le temps de manger"
        },
        {
          "mine": false,
          "text": "le boss est de mauvaise humeur prévois"
        },
        {
          "mine": true,
          "text": "super"
        }
      ]
    },
    {
      "name": "Dylan",
      "messages": [
        {
          "mine": true,
          "text": "ça te dit un ciné vendredi"
        },
        {
          "mine": false,
          "text": "ouais y'a quoi de bien"
        },
        {
          "mine": true,
          "text": "le nouveau film d'action"
        },
        {
          "mine": false,
          "text": "go séance de 20h?"
        },
        {
          "mine": true,
          "text": "parfait"
        }
      ]
    },
    {
      "name": "Bryan",
      "messages": [
        {
          "mine": false,
          "text": "t'as fini la mission?"
        },
        {
          "mine": true,
          "text": "presque il me manque un bout"
        },
        {
          "mine": false,
          "text": "go faut rendre demain"
        },
        {
          "mine": true,
          "text": "jsais jsais"
        }
      ]
    },
    {
      "name": "Sam",
      "messages": [
        {
          "mine": true,
          "text": "tu fais quoi ce week"
        },
        {
          "mine": false,
          "text": "rien de prévu et toi"
        },
        {
          "mine": true,
          "text": "pareil on trouve un truc?"
        },
        {
          "mine": false,
          "text": "rando? il fait beau"
        },
        {
          "mine": true,
          "text": "ah ouais go dimanche"
        }
      ]
    },
    {
      "name": "Alex asso",
      "messages": [
        {
          "mine": false,
          "text": "réu de l'asso reportée à jeudi"
        },
        {
          "mine": true,
          "text": "ok qui gère les inscriptions"
        },
        {
          "mine": false,
          "text": "toi si t'es dispo"
        },
        {
          "mine": true,
          "text": "vas y je m'en occupe"
        }
      ]
    },
    {
      "name": "Charlie",
      "messages": [
        {
          "mine": true,
          "text": "jsuis devant chez toi"
        },
        {
          "mine": false,
          "text": "quoi déjà?? je suis pas prête"
        },
        {
          "mine": true,
          "text": "mdr je t'attends en bas"
        },
        {
          "mine": false,
          "text": "5 min juré"
        }
      ]
    },
    {
      "name": "Zoé",
      "messages": [
        {
          "mine": false,
          "text": "t'as passé un bon anniv?"
        },
        {
          "mine": true,
          "text": "trop bien merci d'être venue"
        },
        {
          "mine": false,
          "text": "c'était génial la déco au top"
        },
        {
          "mine": true,
          "text": "❤️"
        }
      ]
    },
    {
      "name": "Maëlys",
      "messages": [
        {
          "mine": true,
          "text": "tu m'as pas rendu mon bouquin"
        },
        {
          "mine": false,
          "text": "ah oui il est où déjà"
        },
        {
          "mine": true,
          "text": "dans ton sac ptet mdr"
        },
        {
          "mine": false,
          "text": "ah exact désolée je te le ramène"
        }
      ]
    },
    {
      "name": "Nina danse",
      "messages": [
        {
          "mine": false,
          "text": "cours annulé ce soir"
        },
        {
          "mine": true,
          "text": "ah pk"
        },
        {
          "mine": false,
          "text": "la prof est malade"
        },
        {
          "mine": true,
          "text": "ok on se fait un verre à la place?"
        },
        {
          "mine": false,
          "text": "ouiii"
        }
      ]
    },
    {
      "name": "Léna",
      "messages": [
        {
          "mine": true,
          "text": "jsuis triste"
        },
        {
          "mine": false,
          "text": "qu'est ce qui se passe"
        },
        {
          "mine": true,
          "text": "rien de grave juste une journée pourrie"
        },
        {
          "mine": false,
          "text": "je passe ce soir avec du chocolat"
        },
        {
          "mine": true,
          "text": "t'es la meilleure"
        }
      ]
    },
    {
      "name": "Ambre",
      "messages": [
        {
          "mine": false,
          "text": "tu viens à la plage demain?"
        },
        {
          "mine": true,
          "text": "si il fait beau oui"
        },
        {
          "mine": false,
          "text": "météo dit soleil"
        },
        {
          "mine": true,
          "text": "go alors, on part quand"
        },
        {
          "mine": false,
          "text": "10h chez moi"
        }
      ]
    },
    {
      "name": "Tom fac",
      "messages": [
        {
          "mine": false,
          "text": "t'as compris l'exo 3?"
        },
        {
          "mine": true,
          "text": "non rien du tout"
        },
        {
          "mine": false,
          "text": "on demande à Gabriel il capte tout lui"
        },
        {
          "mine": true,
          "text": "ouais go"
        }
      ]
    },
    {
      "name": "Adam",
      "messages": [
        {
          "mine": true,
          "text": "wsh on joue?"
        },
        {
          "mine": false,
          "text": "2 min je finis un truc"
        },
        {
          "mine": true,
          "text": "ok je lance"
        },
        {
          "mine": false,
          "text": "j'arrive"
        }
      ]
    },
    {
      "name": "Rayan",
      "messages": [
        {
          "mine": false,
          "text": "t'es dispo pour le projet ce soir?"
        },
        {
          "mine": true,
          "text": "ouais après 20h"
        },
        {
          "mine": false,
          "text": "ok appel visio?"
        },
        {
          "mine": true,
          "text": "go"
        }
      ]
    },
    {
      "name": "Ilyes",
      "messages": [
        {
          "mine": true,
          "text": "tu viens au match samedi?"
        },
        {
          "mine": false,
          "text": "j'ai pas de place"
        },
        {
          "mine": true,
          "text": "j'en ai une en trop"
        },
        {
          "mine": false,
          "text": "sérieux? go merci frérot"
        }
      ]
    },
    {
      "name": "Nathan",
      "messages": [
        {
          "mine": false,
          "text": "jsuis en retard désolé"
        },
        {
          "mine": true,
          "text": "encore mdr"
        },
        {
          "mine": false,
          "text": "y'avait du monde"
        },
        {
          "mine": true,
          "text": "tkt je t'attends au café"
        }
      ]
    },
    {
      "name": "Ethan",
      "messages": [
        {
          "mine": true,
          "text": "ça te dit une soirée jeux?"
        },
        {
          "mine": false,
          "text": "ouais qui d'autre vient"
        },
        {
          "mine": true,
          "text": "les habitués"
        },
        {
          "mine": false,
          "text": "go j'ramène un jeu"
        }
      ]
    },
    {
      "name": "Timéo",
      "messages": [
        {
          "mine": false,
          "text": "t'as vu ce qu'il a dit"
        },
        {
          "mine": true,
          "text": "ouais grv chelou"
        },
        {
          "mine": false,
          "text": "jsp quoi penser"
        },
        {
          "mine": true,
          "text": "laisse couler"
        }
      ]
    },
    {
      "name": "Gabin",
      "messages": [
        {
          "mine": true,
          "text": "tu me files un coup de main demain?"
        },
        {
          "mine": false,
          "text": "pour quoi"
        },
        {
          "mine": true,
          "text": "monter un meuble"
        },
        {
          "mine": false,
          "text": "ah ouais si tu payes à manger"
        },
        {
          "mine": true,
          "text": "deal"
        }
      ]
    },
    {
      "name": "Sacha",
      "messages": [
        {
          "mine": false,
          "text": "jsuis chez toi t'es où"
        },
        {
          "mine": true,
          "text": "merde j'ai zappé qu'on avait dit aujourd'hui"
        },
        {
          "mine": false,
          "text": "sérieux mdr"
        },
        {
          "mine": true,
          "text": "j'arrive dans 10 min désolé"
        }
      ]
    },
    {
      "name": "Loïc rugby",
      "messages": [
        {
          "mine": false,
          "text": "entraînement maintenu ce soir?"
        },
        {
          "mine": true,
          "text": "ouais malgré la pluie"
        },
        {
          "mine": false,
          "text": "aïe bon je viens quand même"
        },
        {
          "mine": true,
          "text": "le vrai"
        }
      ]
    },
    {
      "name": "Kylian",
      "messages": [
        {
          "mine": true,
          "text": "t'as les résultats?"
        },
        {
          "mine": false,
          "text": "pas encore c'est demain"
        },
        {
          "mine": true,
          "text": "jstress"
        },
        {
          "mine": false,
          "text": "tkt ça va le faire"
        }
      ]
    },
    {
      "name": "Bastien",
      "messages": [
        {
          "mine": false,
          "text": "on se pose ce soir?"
        },
        {
          "mine": true,
          "text": "chez qui"
        },
        {
          "mine": false,
          "text": "chez moi les autres viennent"
        },
        {
          "mine": true,
          "text": "ok j'apporte un truc à grignoter"
        }
      ]
    },
    {
      "name": "Fanny",
      "messages": [
        {
          "mine": true,
          "text": "t'as vu il fait un temps de merde"
        },
        {
          "mine": false,
          "text": "ouais adieu le pique nique"
        },
        {
          "mine": true,
          "text": "on fait ça chez moi alors"
        },
        {
          "mine": false,
          "text": "ah bonne idée go"
        }
      ]
    },
    {
      "name": "Marine boulot",
      "messages": [
        {
          "mine": false,
          "text": "tu prends ta pause quand"
        },
        {
          "mine": true,
          "text": "midi comme d'hab"
        },
        {
          "mine": false,
          "text": "ok on mange dehors ça change"
        },
        {
          "mine": true,
          "text": "go il fait beau"
        }
      ]
    },
    {
      "name": "Justine",
      "messages": [
        {
          "mine": false,
          "text": "il m'a encore posé un lapin"
        },
        {
          "mine": true,
          "text": "nan mais bloque le sérieux"
        },
        {
          "mine": false,
          "text": "jsp j'hésite"
        },
        {
          "mine": true,
          "text": "y'a pas à hésiter"
        },
        {
          "mine": false,
          "text": "t'as raison"
        }
      ]
    },
    {
      "name": "Pauline",
      "messages": [
        {
          "mine": true,
          "text": "tu viens au marché avec moi?"
        },
        {
          "mine": false,
          "text": "ouais à quelle heure"
        },
        {
          "mine": true,
          "text": "10h avant qu'il y ait trop de monde"
        },
        {
          "mine": false,
          "text": "ok je te rejoins là bas"
        }
      ]
    },
    {
      "name": "Morgane",
      "messages": [
        {
          "mine": false,
          "text": "jsuis à deux doigts de démissionner"
        },
        {
          "mine": true,
          "text": "encore une journée comme ça?"
        },
        {
          "mine": false,
          "text": "grv j'en peux plus"
        },
        {
          "mine": true,
          "text": "on en parle ce soir autour d'un verre"
        },
        {
          "mine": false,
          "text": "oui stp"
        }
      ]
    },
    {
      "name": "Coline",
      "messages": [
        {
          "mine": true,
          "text": "t'as fini le cadeau de maman?"
        },
        {
          "mine": false,
          "text": "non j'ai aucune idée"
        },
        {
          "mine": true,
          "text": "on prend le bon d'achat spa alors?"
        },
        {
          "mine": false,
          "text": "ouais c'est plus simple, on split"
        }
      ]
    },
    {
      "name": "Solène",
      "messages": [
        {
          "mine": false,
          "text": "tu dors?"
        },
        {
          "mine": true,
          "text": "non pk"
        },
        {
          "mine": false,
          "text": "jarrive pas à dormir"
        },
        {
          "mine": true,
          "text": "pareil, appel?"
        },
        {
          "mine": false,
          "text": "ouais go"
        }
      ]
    },
    {
      "name": "Maëva",
      "messages": [
        {
          "mine": true,
          "text": "ça te dit un resto jap ce midi?"
        },
        {
          "mine": false,
          "text": "toujours partante pour des sushis"
        },
        {
          "mine": true,
          "text": "12h30 au petit à côté du taf"
        },
        {
          "mine": false,
          "text": "j'y serai"
        }
      ]
    },
    {
      "name": "Anaïs",
      "messages": [
        {
          "mine": false,
          "text": "t'as reçu mon message d'hier?"
        },
        {
          "mine": true,
          "text": "ah non désolée j'ai vu passer et j'ai zappé"
        },
        {
          "mine": false,
          "text": "mdr t'es la pire"
        },
        {
          "mine": true,
          "text": "jsais je réponds là promis"
        }
      ]
    },
    {
      "name": "Clara",
      "messages": [
        {
          "mine": true,
          "text": "on se fait notre soirée pizza-série?"
        },
        {
          "mine": false,
          "text": "ouiii ce soir?"
        },
        {
          "mine": true,
          "text": "go 20h chez toi"
        },
        {
          "mine": false,
          "text": "j'ai déjà choisi la série"
        },
        {
          "mine": true,
          "text": "pas une romcom stp"
        },
        {
          "mine": false,
          "text": "trop tard"
        }
      ]
    },
    {
      "name": "Julie lycée",
      "messages": [
        {
          "mine": false,
          "text": "ça fait trop longtemps faut qu'on se voie"
        },
        {
          "mine": true,
          "text": "grv, un café cette semaine?"
        },
        {
          "mine": false,
          "text": "jeudi je peux"
        },
        {
          "mine": true,
          "text": "parfait je note"
        },
        {
          "mine": false,
          "text": "trop hâte de te raconter"
        }
      ]
    },
    {
      "name": "Aurélie",
      "messages": [
        {
          "mine": true,
          "text": "t'as passé une bonne journée?"
        },
        {
          "mine": false,
          "text": "bof longue et toi"
        },
        {
          "mine": true,
          "text": "pareil vivement ce soir"
        },
        {
          "mine": false,
          "text": "on se fait une balade pour décompresser?"
        },
        {
          "mine": true,
          "text": "oui bonne idée"
        }
      ]
    },
    {
      "name": "Doudou",
      "messages": [
        {
          "mine": false,
          "text": "tu rentres bientôt?"
        },
        {
          "mine": true,
          "text": "oui je pars du taf là"
        },
        {
          "mine": false,
          "text": "cool je nous ai fait un truc bon"
        },
        {
          "mine": true,
          "text": "t'es adorable, à toute"
        }
      ]
    },
    {
      "name": "bébé",
      "messages": [
        {
          "mine": true,
          "text": "pense à prendre du pain"
        },
        {
          "mine": false,
          "text": "deja acheté"
        },
        {
          "mine": true,
          "text": "et le fromage?"
        },
        {
          "mine": false,
          "text": "ah zut j'ai oublié"
        },
        {
          "mine": true,
          "text": "mdr je passe le prendre"
        }
      ]
    },
    {
      "name": "Riri",
      "messages": [
        {
          "mine": false,
          "text": "tu viens à la crémaillère de Théo?"
        },
        {
          "mine": true,
          "text": "ouais faut apporter quoi"
        },
        {
          "mine": false,
          "text": "une bouteille je crois"
        },
        {
          "mine": true,
          "text": "ok on y va ensemble?"
        },
        {
          "mine": false,
          "text": "go je passe te prendre"
        }
      ]
    },
    {
      "name": "Dédé",
      "messages": [
        {
          "mine": true,
          "text": "wsh vieux ça fait un bail"
        },
        {
          "mine": false,
          "text": "grv frérot faut qu'on se capte"
        },
        {
          "mine": true,
          "text": "ce weekend?"
        },
        {
          "mine": false,
          "text": "samedi je suis chaud"
        },
        {
          "mine": true,
          "text": "go"
        }
      ]
    },
    {
      "name": "Nono",
      "messages": [
        {
          "mine": false,
          "text": "t'as réussi ton entretien?"
        },
        {
          "mine": true,
          "text": "jsp ils rappellent la semaine pro"
        },
        {
          "mine": false,
          "text": "tkt t'assures toujours"
        },
        {
          "mine": true,
          "text": "merci ça fait plaisir"
        }
      ]
    },
    {
      "name": "Momo",
      "messages": [
        {
          "mine": true,
          "text": "tu m'as ramené mon écharpe?"
        },
        {
          "mine": false,
          "text": "ah oui elle est dans ma voiture"
        },
        {
          "mine": true,
          "text": "ok tu passes quand"
        },
        {
          "mine": false,
          "text": "demain je te la dépose"
        }
      ]
    },
    {
      "name": "Lulu",
      "messages": [
        {
          "mine": false,
          "text": "jsuis dans le train je m'ennuie"
        },
        {
          "mine": true,
          "text": "raconte moi ta vie alors"
        },
        {
          "mine": false,
          "text": "rien à raconter justement mdr"
        },
        {
          "mine": true,
          "text": "mets de la musique et dors"
        },
        {
          "mine": false,
          "text": "bonne idée"
        }
      ]
    },
    {
      "name": "Fifi",
      "messages": [
        {
          "mine": true,
          "text": "on court dimanche matin?"
        },
        {
          "mine": false,
          "text": "ouais si tu me réveilles"
        },
        {
          "mine": true,
          "text": "8h devant le parc"
        },
        {
          "mine": false,
          "text": "okok pas plus tôt stp"
        }
      ]
    },
    {
      "name": "Titi",
      "messages": [
        {
          "mine": false,
          "text": "t'as vu la photo que maman a envoyée"
        },
        {
          "mine": true,
          "text": "mdr on était trop petits"
        },
        {
          "mine": false,
          "text": "j'étais horrible"
        },
        {
          "mine": true,
          "text": "non mais ta coupe par contre"
        },
        {
          "mine": false,
          "text": "tais toi"
        }
      ]
    }
  ],
  "it": [
    {
      "name": "Giulia",
      "messages": [
        {
          "mine": false,
          "text": "allora stasera?"
        },
        {
          "mine": true,
          "text": "boh sono morta"
        },
        {
          "mine": true,
          "text": "magari un aperitivo veloce"
        },
        {
          "mine": false,
          "text": "dai alle 8 sotto casa mia"
        },
        {
          "mine": true,
          "text": "ok ma poi torno presto eh"
        },
        {
          "mine": false,
          "text": "sii sii lo dici sempre ahah"
        }
      ]
    },
    {
      "name": "Mamma",
      "messages": [
        {
          "mine": false,
          "text": "hai mangiato?"
        },
        {
          "mine": true,
          "text": "si ma"
        },
        {
          "mine": false,
          "text": "cosa"
        },
        {
          "mine": true,
          "text": "solo un panino, tardi"
        },
        {
          "mine": false,
          "text": "eh sempre di corsa tu"
        },
        {
          "mine": false,
          "text": "domenica vieni a pranzo?"
        },
        {
          "mine": true,
          "text": "si arrivo verso l una"
        }
      ]
    },
    {
      "name": "amore",
      "messages": [
        {
          "mine": true,
          "text": "dove sei"
        },
        {
          "mine": false,
          "text": "in fila alla cassa"
        },
        {
          "mine": false,
          "text": "hai bisogno di qualcosa?"
        },
        {
          "mine": true,
          "text": "prendi il latte pls"
        },
        {
          "mine": true,
          "text": "e la carta igienica"
        },
        {
          "mine": false,
          "text": "ricevuto capo"
        },
        {
          "mine": true,
          "text": "tvb"
        }
      ]
    },
    {
      "name": "Marco",
      "messages": [
        {
          "mine": false,
          "text": "raga ma la partita a che ora"
        },
        {
          "mine": true,
          "text": "20.45"
        },
        {
          "mine": false,
          "text": "ah ok pensavo prima"
        },
        {
          "mine": true,
          "text": "vieni da me a vederla?"
        },
        {
          "mine": false,
          "text": "porto le birre"
        }
      ]
    },
    {
      "name": "le ragazze",
      "messages": [
        {
          "mine": false,
          "text": "allora sabato si decide o no"
        },
        {
          "mine": false,
          "text": "io ci sono"
        },
        {
          "mine": true,
          "text": "anche io ma dopo le 9"
        },
        {
          "mine": false,
          "text": "prenoto per 5 allora"
        },
        {
          "mine": false,
          "text": "chi manca sempre chiara ovvio"
        },
        {
          "mine": false,
          "text": "arrivo arrivo giuro"
        },
        {
          "mine": true,
          "text": "ahahah sicuro"
        }
      ]
    },
    {
      "name": "Papà",
      "messages": [
        {
          "mine": false,
          "text": "sei passata a prendere le chiavi?"
        },
        {
          "mine": true,
          "text": "no scusa me ne sono dimenticata"
        },
        {
          "mine": false,
          "text": "vabbè domani"
        },
        {
          "mine": true,
          "text": "domani mattina passo giuro"
        },
        {
          "mine": false,
          "text": "ok guida piano"
        }
      ]
    },
    {
      "name": "Fede",
      "messages": [
        {
          "mine": true,
          "text": "oh ma hai visto il messaggio di luca"
        },
        {
          "mine": false,
          "text": "no cosa ha scritto"
        },
        {
          "mine": true,
          "text": "niente lascia stare poi ti dico dal vivo"
        },
        {
          "mine": false,
          "text": "no ora dimmi"
        },
        {
          "mine": true,
          "text": "ahah domani giuro"
        },
        {
          "mine": false,
          "text": "sei odioso"
        }
      ]
    },
    {
      "name": "Sara palestra",
      "messages": [
        {
          "mine": false,
          "text": "vai oggi?"
        },
        {
          "mine": true,
          "text": "penso alle 18"
        },
        {
          "mine": false,
          "text": "ok ci vediamo li"
        },
        {
          "mine": true,
          "text": "gambe oggi porta pazienza"
        },
        {
          "mine": false,
          "text": "no ti prego non le gambe"
        }
      ]
    },
    {
      "name": "Luca",
      "messages": [
        {
          "mine": false,
          "text": "dove sei"
        },
        {
          "mine": true,
          "text": "sto arrivando 5 min"
        },
        {
          "mine": false,
          "text": "hai detto 5 min mezz ora fa"
        },
        {
          "mine": true,
          "text": "traffico"
        },
        {
          "mine": false,
          "text": "cmq ti aspetto al bar"
        }
      ]
    },
    {
      "name": "Chiara",
      "messages": [
        {
          "mine": false,
          "text": "ma poi com è andata ieri"
        },
        {
          "mine": true,
          "text": "un disastro non ne parliamo"
        },
        {
          "mine": false,
          "text": "oddio racconta"
        },
        {
          "mine": true,
          "text": "dopo ti chiamo"
        },
        {
          "mine": false,
          "text": "aspetto qui col popcorn"
        }
      ]
    },
    {
      "name": "Nonna",
      "messages": [
        {
          "mine": false,
          "text": "tesoro sei arrivata a casa?"
        },
        {
          "mine": true,
          "text": "si nonna tutto bene"
        },
        {
          "mine": false,
          "text": "ho fatto il sugo se vuoi ne porto"
        },
        {
          "mine": true,
          "text": "grazie passo domenica"
        },
        {
          "mine": false,
          "text": "ti aspetto"
        }
      ]
    },
    {
      "name": "calcetto",
      "messages": [
        {
          "mine": false,
          "text": "giovedì campo alle 21 ci siamo tutti?"
        },
        {
          "mine": false,
          "text": "io ci sono"
        },
        {
          "mine": true,
          "text": "presente"
        },
        {
          "mine": false,
          "text": "manca il decimo"
        },
        {
          "mine": false,
          "text": "chiamo mio cugino"
        },
        {
          "mine": true,
          "text": "basta che para qualcosa stavolta"
        },
        {
          "mine": false,
          "text": "ahahah"
        }
      ]
    },
    {
      "name": "Ale",
      "messages": [
        {
          "mine": true,
          "text": "hai finito di lavorare?"
        },
        {
          "mine": false,
          "text": "no ancora qui"
        },
        {
          "mine": false,
          "text": "che palle"
        },
        {
          "mine": true,
          "text": "dai poi ci beviamo una cosa"
        },
        {
          "mine": false,
          "text": "speriamo"
        }
      ]
    },
    {
      "name": "Vale",
      "messages": [
        {
          "mine": false,
          "text": "ti va di venire al mercato domani mattina"
        },
        {
          "mine": true,
          "text": "a che ora"
        },
        {
          "mine": false,
          "text": "presto se no finisce la roba buona"
        },
        {
          "mine": true,
          "text": "ok ma non prestissimo"
        },
        {
          "mine": false,
          "text": "9 e mezza"
        },
        {
          "mine": true,
          "text": "ci sto"
        }
      ]
    },
    {
      "name": "Matteo",
      "messages": [
        {
          "mine": false,
          "text": "oh mi presti il caricabatterie che ho lasciato da te"
        },
        {
          "mine": true,
          "text": "quale non ho niente qui"
        },
        {
          "mine": false,
          "text": "quello nero era sul tavolo"
        },
        {
          "mine": true,
          "text": "boh guardo poi"
        },
        {
          "mine": false,
          "text": "ok grazie"
        }
      ]
    },
    {
      "name": "casa",
      "messages": [
        {
          "mine": false,
          "text": "chi ha usato il mio shampoo"
        },
        {
          "mine": true,
          "text": "non io"
        },
        {
          "mine": false,
          "text": "certo come no"
        },
        {
          "mine": false,
          "text": "cmq stasera pulizie di là"
        },
        {
          "mine": true,
          "text": "domani che oggi non ci sono"
        },
        {
          "mine": false,
          "text": "dici sempre così"
        }
      ]
    },
    {
      "name": "Fra",
      "messages": [
        {
          "mine": true,
          "text": "raga scusate ho fatto tardi"
        },
        {
          "mine": false,
          "text": "come sempre"
        },
        {
          "mine": true,
          "text": "arrivo tra 10"
        },
        {
          "mine": false,
          "text": "ordiniamo intanto"
        },
        {
          "mine": true,
          "text": "prendetemi una margherita"
        }
      ]
    },
    {
      "name": "Elena ❤️",
      "messages": [
        {
          "mine": false,
          "text": "mi manchi"
        },
        {
          "mine": true,
          "text": "anche tu"
        },
        {
          "mine": true,
          "text": "che fai stasera"
        },
        {
          "mine": false,
          "text": "niente, divano e serie"
        },
        {
          "mine": true,
          "text": "arrivo?"
        },
        {
          "mine": false,
          "text": "sii sbrigati"
        }
      ]
    },
    {
      "name": "Davide",
      "messages": [
        {
          "mine": false,
          "text": "hai per caso il pdf di ieri"
        },
        {
          "mine": true,
          "text": "quale"
        },
        {
          "mine": false,
          "text": "quello che ci ha mandato il prof"
        },
        {
          "mine": true,
          "text": "aspetta te lo giro"
        },
        {
          "mine": false,
          "text": "sei un mito grazie"
        }
      ]
    },
    {
      "name": "Martina",
      "messages": [
        {
          "mine": false,
          "text": "ma tu domani lavori?"
        },
        {
          "mine": true,
          "text": "purtroppo si"
        },
        {
          "mine": false,
          "text": "uff volevo andare al lago"
        },
        {
          "mine": true,
          "text": "dai domenica"
        },
        {
          "mine": false,
          "text": "se non piove"
        }
      ]
    },
    {
      "name": "Anna uni",
      "messages": [
        {
          "mine": false,
          "text": "domani lezione o salti"
        },
        {
          "mine": true,
          "text": "boh dipende dalla sveglia ahah"
        },
        {
          "mine": false,
          "text": "dai vieni che se no mi annoio"
        },
        {
          "mine": true,
          "text": "ok ci provo"
        },
        {
          "mine": false,
          "text": "tienimi il posto se arrivi prima"
        }
      ]
    },
    {
      "name": "Ste",
      "messages": [
        {
          "mine": true,
          "text": "novità?"
        },
        {
          "mine": false,
          "text": "boh niente"
        },
        {
          "mine": false,
          "text": "il solito"
        },
        {
          "mine": true,
          "text": "eh anche qui"
        },
        {
          "mine": false,
          "text": "che noia sta settimana"
        }
      ]
    },
    {
      "name": "famiglia",
      "messages": [
        {
          "mine": false,
          "text": "domenica pranzo da nonna, ci siamo tutti?"
        },
        {
          "mine": true,
          "text": "io ci sono"
        },
        {
          "mine": false,
          "text": "porto il dolce"
        },
        {
          "mine": false,
          "text": "io arrivo un po tardi dopo il turno"
        },
        {
          "mine": true,
          "text": "ok avvisiamo nonna"
        },
        {
          "mine": false,
          "text": "già fatto"
        }
      ]
    },
    {
      "name": "Giorgia",
      "messages": [
        {
          "mine": false,
          "text": "ma alla fine con quel tipo?"
        },
        {
          "mine": true,
          "text": "niente ha sparito"
        },
        {
          "mine": false,
          "text": "nooo scusa che scemo"
        },
        {
          "mine": true,
          "text": "vabbè meglio così"
        },
        {
          "mine": false,
          "text": "brava next"
        }
      ]
    },
    {
      "name": "Max lavoro",
      "messages": [
        {
          "mine": false,
          "text": "sei in ufficio oggi?"
        },
        {
          "mine": true,
          "text": "no smart"
        },
        {
          "mine": false,
          "text": "ah ok volevo un caffè"
        },
        {
          "mine": true,
          "text": "domani ci sono"
        },
        {
          "mine": false,
          "text": "ok domani allora"
        }
      ]
    },
    {
      "name": "Manu",
      "messages": [
        {
          "mine": true,
          "text": "ma quel film che dicevi come si chiama"
        },
        {
          "mine": false,
          "text": "boh non mi ricordo"
        },
        {
          "mine": false,
          "text": "ah aspetta"
        },
        {
          "mine": false,
          "text": "quello coi due fratelli"
        },
        {
          "mine": true,
          "text": "grazie utilissimo ahah"
        }
      ]
    },
    {
      "name": "Bea",
      "messages": [
        {
          "mine": false,
          "text": "domani vengo a prenderti?"
        },
        {
          "mine": true,
          "text": "si dai alle 8.15"
        },
        {
          "mine": false,
          "text": "8.15 spaccate però"
        },
        {
          "mine": true,
          "text": "sono giù giuro"
        },
        {
          "mine": false,
          "text": "vedremo"
        }
      ]
    },
    {
      "name": "Simone",
      "messages": [
        {
          "mine": false,
          "text": "hai visto che hanno aperto quel posto nuovo"
        },
        {
          "mine": true,
          "text": "no dove"
        },
        {
          "mine": false,
          "text": "vicino alla piazza, fanno panini assurdi"
        },
        {
          "mine": true,
          "text": "ci andiamo sabato"
        },
        {
          "mine": false,
          "text": "già ho fame"
        }
      ]
    },
    {
      "name": "Ilaria",
      "messages": [
        {
          "mine": true,
          "text": "come stai oggi?"
        },
        {
          "mine": false,
          "text": "meh"
        },
        {
          "mine": false,
          "text": "sono a pezzi"
        },
        {
          "mine": true,
          "text": "vuoi che passo"
        },
        {
          "mine": false,
          "text": "no tranquilla dai"
        },
        {
          "mine": true,
          "text": "se cambi idea ci sono"
        }
      ]
    },
    {
      "name": "compagnia",
      "messages": [
        {
          "mine": false,
          "text": "raga weekend cosa facciamo"
        },
        {
          "mine": false,
          "text": "montagna?"
        },
        {
          "mine": true,
          "text": "no fa troppo caldo"
        },
        {
          "mine": false,
          "text": "mare allora"
        },
        {
          "mine": false,
          "text": "chi ha la macchina"
        },
        {
          "mine": true,
          "text": "io ma pieno di gente eh"
        },
        {
          "mine": false,
          "text": "ci stringiamo"
        }
      ]
    },
    {
      "name": "Riccardo",
      "messages": [
        {
          "mine": false,
          "text": "mi sa che salto stasera"
        },
        {
          "mine": true,
          "text": "come no dai"
        },
        {
          "mine": false,
          "text": "sono distrutto scusa"
        },
        {
          "mine": true,
          "text": "vabbè la prossima"
        },
        {
          "mine": false,
          "text": "prometto"
        }
      ]
    },
    {
      "name": "Cami",
      "messages": [
        {
          "mine": false,
          "text": "hai per caso ancora il mio maglione"
        },
        {
          "mine": true,
          "text": "quello grigio?"
        },
        {
          "mine": false,
          "text": "si"
        },
        {
          "mine": true,
          "text": "si è qui te lo porto giovedì"
        },
        {
          "mine": false,
          "text": "grazie mi serviva"
        }
      ]
    },
    {
      "name": "Tommy",
      "messages": [
        {
          "mine": true,
          "text": "oh domani ci sei per il trasloco"
        },
        {
          "mine": false,
          "text": "a che ora"
        },
        {
          "mine": true,
          "text": "9"
        },
        {
          "mine": false,
          "text": "presto ma ok ci sono"
        },
        {
          "mine": true,
          "text": "porta i guanti"
        },
        {
          "mine": false,
          "text": "ok"
        }
      ]
    },
    {
      "name": "Nonno",
      "messages": [
        {
          "mine": false,
          "text": "come va il lavoro"
        },
        {
          "mine": true,
          "text": "tanto da fare ma bene"
        },
        {
          "mine": false,
          "text": "non stancarti troppo"
        },
        {
          "mine": true,
          "text": "tranquillo nonno"
        },
        {
          "mine": false,
          "text": "vieni a trovarmi che ti faccio vedere l orto"
        }
      ]
    },
    {
      "name": "Gio",
      "messages": [
        {
          "mine": false,
          "text": "ma poi hai chiamato tu o no"
        },
        {
          "mine": true,
          "text": "no pensavo tu"
        },
        {
          "mine": false,
          "text": "ecco perché non ha risposto nessuno ahah"
        },
        {
          "mine": true,
          "text": "che disastro siamo"
        },
        {
          "mine": false,
          "text": "chiamo io va"
        }
      ]
    },
    {
      "name": "Federica",
      "messages": [
        {
          "mine": false,
          "text": "ti va un caffè dopo?"
        },
        {
          "mine": true,
          "text": "sii ne ho bisogno"
        },
        {
          "mine": false,
          "text": "solito posto"
        },
        {
          "mine": true,
          "text": "a che ora"
        },
        {
          "mine": false,
          "text": "15.30"
        },
        {
          "mine": true,
          "text": "ok"
        }
      ]
    },
    {
      "name": "coinquilini",
      "messages": [
        {
          "mine": false,
          "text": "bolletta arrivata, dividiamo"
        },
        {
          "mine": true,
          "text": "quanto viene"
        },
        {
          "mine": false,
          "text": "vi giro dopo il conto"
        },
        {
          "mine": false,
          "text": "cmq stavolta pago io e voi mi rimborsate"
        },
        {
          "mine": true,
          "text": "ok segna"
        },
        {
          "mine": false,
          "text": "sempre a segnare io"
        }
      ]
    },
    {
      "name": "Lollo",
      "messages": [
        {
          "mine": true,
          "text": "domani allenamento c è?"
        },
        {
          "mine": false,
          "text": "si ma sposto alle 19"
        },
        {
          "mine": true,
          "text": "ah ok meglio"
        },
        {
          "mine": false,
          "text": "porta la maglia giusta stavolta"
        },
        {
          "mine": true,
          "text": "ahah scusa"
        }
      ]
    },
    {
      "name": "Susy",
      "messages": [
        {
          "mine": false,
          "text": "hai visto le foto di ieri"
        },
        {
          "mine": true,
          "text": "no mandale"
        },
        {
          "mine": false,
          "text": "usciamo malissimo tutte ahah"
        },
        {
          "mine": true,
          "text": "cancellale ti prego"
        },
        {
          "mine": false,
          "text": "troppo tardi già postate"
        },
        {
          "mine": true,
          "text": "ti odio"
        }
      ]
    },
    {
      "name": "Paolo",
      "messages": [
        {
          "mine": false,
          "text": "domenica c è la partita vieni?"
        },
        {
          "mine": true,
          "text": "dipende dall orario"
        },
        {
          "mine": false,
          "text": "pomeriggio"
        },
        {
          "mine": true,
          "text": "allora ci sono"
        },
        {
          "mine": false,
          "text": "bene"
        }
      ]
    },
    {
      "name": "tesoro",
      "messages": [
        {
          "mine": false,
          "text": "hai chiuso il gas?"
        },
        {
          "mine": true,
          "text": "si tranquilla"
        },
        {
          "mine": false,
          "text": "sicuro sicuro?"
        },
        {
          "mine": true,
          "text": "controllato due volte"
        },
        {
          "mine": false,
          "text": "ok ti amo scusa lansia"
        },
        {
          "mine": true,
          "text": "ahah lo so ti amo"
        }
      ]
    },
    {
      "name": "Michi",
      "messages": [
        {
          "mine": true,
          "text": "che fai di bello"
        },
        {
          "mine": false,
          "text": "niente spiaggiato sul divano"
        },
        {
          "mine": true,
          "text": "che invidia"
        },
        {
          "mine": false,
          "text": "vieni"
        },
        {
          "mine": true,
          "text": "magari tra un ora"
        }
      ]
    },
    {
      "name": "Ceci",
      "messages": [
        {
          "mine": false,
          "text": "ma alla fine sei andata dal parrucchiere"
        },
        {
          "mine": true,
          "text": "no ho rimandato"
        },
        {
          "mine": false,
          "text": "tipico"
        },
        {
          "mine": true,
          "text": "eh lo so"
        },
        {
          "mine": false,
          "text": "cmq ti stanno bene anche così"
        }
      ]
    },
    {
      "name": "Andrea",
      "messages": [
        {
          "mine": false,
          "text": "oh scusa ho visto ora il messaggio"
        },
        {
          "mine": true,
          "text": "tranquillo"
        },
        {
          "mine": false,
          "text": "cosa mi dicevi"
        },
        {
          "mine": true,
          "text": "niente ormai è passata"
        },
        {
          "mine": false,
          "text": "ok scusa ancora"
        }
      ]
    },
    {
      "name": "Silvia yoga",
      "messages": [
        {
          "mine": false,
          "text": "domani lezione la fai?"
        },
        {
          "mine": true,
          "text": "si quella delle 10"
        },
        {
          "mine": false,
          "text": "ah bene ci vediamo li"
        },
        {
          "mine": true,
          "text": "porta il tappetino che l ultimo era rotto"
        },
        {
          "mine": false,
          "text": "ahah ok"
        }
      ]
    },
    {
      "name": "Robby",
      "messages": [
        {
          "mine": true,
          "text": "ci sei stasera per una birra"
        },
        {
          "mine": false,
          "text": "boh vediamo"
        },
        {
          "mine": false,
          "text": "sono un po al verde"
        },
        {
          "mine": true,
          "text": "offro io dai"
        },
        {
          "mine": false,
          "text": "allora ci sono ahah"
        }
      ]
    },
    {
      "name": "Teo",
      "messages": [
        {
          "mine": false,
          "text": "hai finito quella serie?"
        },
        {
          "mine": true,
          "text": "no ferma alla terza"
        },
        {
          "mine": false,
          "text": "sbrigati che voglio commentare il finale"
        },
        {
          "mine": true,
          "text": "non spoilerare"
        },
        {
          "mine": false,
          "text": "muoviti allora"
        }
      ]
    },
    {
      "name": "aperitivo",
      "messages": [
        {
          "mine": false,
          "text": "venerdì confermato?"
        },
        {
          "mine": true,
          "text": "per me si"
        },
        {
          "mine": false,
          "text": "dove"
        },
        {
          "mine": false,
          "text": "solito posto in centro"
        },
        {
          "mine": true,
          "text": "ok alle 19"
        },
        {
          "mine": false,
          "text": "prenoto per 6"
        }
      ]
    },
    {
      "name": "Marta ufficio",
      "messages": [
        {
          "mine": false,
          "text": "pausa?"
        },
        {
          "mine": true,
          "text": "si ti prego"
        },
        {
          "mine": false,
          "text": "giù tra 5"
        },
        {
          "mine": true,
          "text": "arrivo"
        },
        {
          "mine": false,
          "text": "prendi tu i caffè che ho le mani piene"
        }
      ]
    },
    {
      "name": "Pippo",
      "messages": [
        {
          "mine": true,
          "text": "raga chi guida domani"
        },
        {
          "mine": false,
          "text": "non io ho bevuto"
        },
        {
          "mine": true,
          "text": "guido io va"
        },
        {
          "mine": false,
          "text": "grande"
        },
        {
          "mine": true,
          "text": "ma la benzina la dividiamo"
        }
      ]
    },
    {
      "name": "Valentina",
      "messages": [
        {
          "mine": false,
          "text": "ci vediamo sabato al compleanno?"
        },
        {
          "mine": true,
          "text": "si ma non so cosa regalare"
        },
        {
          "mine": false,
          "text": "facciamo un regalo insieme"
        },
        {
          "mine": true,
          "text": "ottima idea"
        },
        {
          "mine": false,
          "text": "ti dico una cifra dopo"
        }
      ]
    },
    {
      "name": "Alessandro",
      "messages": [
        {
          "mine": false,
          "text": "hai il numero di giulia? il mio non prende"
        },
        {
          "mine": true,
          "text": "te lo giro"
        },
        {
          "mine": false,
          "text": "grazie"
        },
        {
          "mine": true,
          "text": "cmq scrivile su qua che risponde prima"
        },
        {
          "mine": false,
          "text": "vero fatto"
        }
      ]
    },
    {
      "name": "🐻",
      "messages": [
        {
          "mine": false,
          "text": "buongiorno amore"
        },
        {
          "mine": true,
          "text": "buongiorno"
        },
        {
          "mine": true,
          "text": "dormito bene?"
        },
        {
          "mine": false,
          "text": "malissimo mi mancavi"
        },
        {
          "mine": true,
          "text": "stasera recuperiamo"
        },
        {
          "mine": false,
          "text": "❤️"
        }
      ]
    },
    {
      "name": "Giorgio casa",
      "messages": [
        {
          "mine": false,
          "text": "hai chiuso la porta a chiave uscendo?"
        },
        {
          "mine": true,
          "text": "si"
        },
        {
          "mine": false,
          "text": "ok perché la mia chiave non la trovo"
        },
        {
          "mine": true,
          "text": "guarda nella giacca"
        },
        {
          "mine": false,
          "text": "trovata grazie"
        }
      ]
    },
    {
      "name": "Nico",
      "messages": [
        {
          "mine": true,
          "text": "domani vieni in bici o no"
        },
        {
          "mine": false,
          "text": "boh che tempo fa"
        },
        {
          "mine": true,
          "text": "dicono sole"
        },
        {
          "mine": false,
          "text": "allora vengo"
        },
        {
          "mine": true,
          "text": "partiamo dal solito bar alle 8"
        }
      ]
    },
    {
      "name": "ufficio",
      "messages": [
        {
          "mine": false,
          "text": "riunione spostata alle 15"
        },
        {
          "mine": true,
          "text": "ok grazie dell avviso"
        },
        {
          "mine": false,
          "text": "chi porta il verbale"
        },
        {
          "mine": true,
          "text": "lo faccio io"
        },
        {
          "mine": false,
          "text": "grande"
        }
      ]
    },
    {
      "name": "Beatrice",
      "messages": [
        {
          "mine": false,
          "text": "ma tu domani sei libera dopo cena?"
        },
        {
          "mine": true,
          "text": "penso di si perché"
        },
        {
          "mine": false,
          "text": "volevo fare due passi e parlare"
        },
        {
          "mine": true,
          "text": "tutto ok?"
        },
        {
          "mine": false,
          "text": "si si niente di che"
        },
        {
          "mine": true,
          "text": "ok ci sono"
        }
      ]
    },
    {
      "name": "Ricky",
      "messages": [
        {
          "mine": false,
          "text": "oh mi rispondi dopo tre giorni ahah"
        },
        {
          "mine": true,
          "text": "scusa non avevo visto"
        },
        {
          "mine": false,
          "text": "cmq ti chiedevo se venivi al concerto"
        },
        {
          "mine": true,
          "text": "quando è"
        },
        {
          "mine": false,
          "text": "il 20"
        },
        {
          "mine": true,
          "text": "ci sto compra i biglietti"
        }
      ]
    },
    {
      "name": "Camilla",
      "messages": [
        {
          "mine": true,
          "text": "che palle sto lunedì"
        },
        {
          "mine": false,
          "text": "eh ne parliamo"
        },
        {
          "mine": false,
          "text": "già voglio il weekend"
        },
        {
          "mine": true,
          "text": "mancano solo 4 giorni ahah"
        },
        {
          "mine": false,
          "text": "non dirlo"
        }
      ]
    },
    {
      "name": "Dani",
      "messages": [
        {
          "mine": false,
          "text": "hai sentito che rientra in città?"
        },
        {
          "mine": true,
          "text": "chi"
        },
        {
          "mine": false,
          "text": "sai chi"
        },
        {
          "mine": true,
          "text": "no dimmi"
        },
        {
          "mine": false,
          "text": "ti chiamo che è lunga"
        }
      ]
    },
    {
      "name": "Giova",
      "messages": [
        {
          "mine": true,
          "text": "domani lavori fino a tardi?"
        },
        {
          "mine": false,
          "text": "si fino alle 8 circa"
        },
        {
          "mine": true,
          "text": "uff volevo cenare insieme"
        },
        {
          "mine": false,
          "text": "dopo si può"
        },
        {
          "mine": true,
          "text": "ok ti aspetto"
        }
      ]
    },
    {
      "name": "Sofia",
      "messages": [
        {
          "mine": false,
          "text": "ma domani porti tu il caricatore o io"
        },
        {
          "mine": true,
          "text": "porta tu che io scordo sempre"
        },
        {
          "mine": false,
          "text": "ahah verissimo"
        },
        {
          "mine": true,
          "text": "grazie"
        },
        {
          "mine": false,
          "text": "figurati"
        }
      ]
    },
    {
      "name": "Emma",
      "messages": [
        {
          "mine": false,
          "text": "che fai per pranzo"
        },
        {
          "mine": true,
          "text": "avanzi di ieri e tu"
        },
        {
          "mine": false,
          "text": "niente in frigo dramma"
        },
        {
          "mine": true,
          "text": "vieni qui che c è pasta"
        },
        {
          "mine": false,
          "text": "arrivo di corsa"
        }
      ]
    },
    {
      "name": "Leo",
      "messages": [
        {
          "mine": true,
          "text": "oh domani ci si vede in stazione o direttamente li"
        },
        {
          "mine": false,
          "text": "meglio stazione così andiamo insieme"
        },
        {
          "mine": true,
          "text": "ok treno delle 9.10"
        },
        {
          "mine": false,
          "text": "non fare tardi"
        },
        {
          "mine": true,
          "text": "guarda chi parla"
        }
      ]
    },
    {
      "name": "Vero",
      "messages": [
        {
          "mine": false,
          "text": "ti ho scritto ieri e mi hai lasciata in visualizzato"
        },
        {
          "mine": true,
          "text": "scusa amo giornata assurda"
        },
        {
          "mine": false,
          "text": "vabbè ti perdono"
        },
        {
          "mine": true,
          "text": "recupero stasera con una call"
        },
        {
          "mine": false,
          "text": "ok alle 21"
        }
      ]
    },
    {
      "name": "Cri",
      "messages": [
        {
          "mine": false,
          "text": "ma il libro che ti ho prestato"
        },
        {
          "mine": true,
          "text": "ancora da finire scusa"
        },
        {
          "mine": false,
          "text": "tranquilla non c è fretta"
        },
        {
          "mine": true,
          "text": "te lo ridò settimana prossima"
        },
        {
          "mine": false,
          "text": "ok"
        }
      ]
    },
    {
      "name": "Marti",
      "messages": [
        {
          "mine": true,
          "text": "sto malissimo ho mangiato troppo ahah"
        },
        {
          "mine": false,
          "text": "eh chi te lo fa fare"
        },
        {
          "mine": true,
          "text": "era troppo buono"
        },
        {
          "mine": false,
          "text": "sempre la stessa storia"
        },
        {
          "mine": true,
          "text": "zitta tu ieri idem"
        }
      ]
    },
    {
      "name": "Alba",
      "messages": [
        {
          "mine": false,
          "text": "domani caffè prima del lavoro?"
        },
        {
          "mine": true,
          "text": "sii alle 8 al bar sotto"
        },
        {
          "mine": false,
          "text": "perfetto"
        },
        {
          "mine": true,
          "text": "ho bisogno di sfogarmi un attimo"
        },
        {
          "mine": false,
          "text": "ci sono, raccontami tutto"
        }
      ]
    },
    {
      "name": "Filo",
      "messages": [
        {
          "mine": true,
          "text": "raga chi porta la cassa domani"
        },
        {
          "mine": false,
          "text": "ce l ho io ma è scarica"
        },
        {
          "mine": true,
          "text": "caricala stanotte"
        },
        {
          "mine": false,
          "text": "ci provo"
        },
        {
          "mine": true,
          "text": "senza musica è tristissimo"
        }
      ]
    },
    {
      "name": "Gaia",
      "messages": [
        {
          "mine": false,
          "text": "com è andato il colloquio"
        },
        {
          "mine": true,
          "text": "boh non saprei"
        },
        {
          "mine": false,
          "text": "dai secondo me bene"
        },
        {
          "mine": true,
          "text": "speriamo mi fanno sapere venerdì"
        },
        {
          "mine": false,
          "text": "incrocio le dita"
        }
      ]
    },
    {
      "name": "Enrico palestra",
      "messages": [
        {
          "mine": false,
          "text": "oggi petto vieni?"
        },
        {
          "mine": true,
          "text": "si ma tardi verso le 19.30"
        },
        {
          "mine": false,
          "text": "ok ti aspetto per la panca"
        },
        {
          "mine": true,
          "text": "occhio che ieri mi sono fatto male alla spalla"
        },
        {
          "mine": false,
          "text": "vai piano allora"
        }
      ]
    },
    {
      "name": "Giada",
      "messages": [
        {
          "mine": true,
          "text": "ma domani ci sei alla cena?"
        },
        {
          "mine": false,
          "text": "quale cena"
        },
        {
          "mine": true,
          "text": "quella di sara"
        },
        {
          "mine": false,
          "text": "prima notizia ahah"
        },
        {
          "mine": true,
          "text": "ti giro il messaggio"
        }
      ]
    },
    {
      "name": "Pietro",
      "messages": [
        {
          "mine": false,
          "text": "hai lasciato le luci accese in salotto"
        },
        {
          "mine": true,
          "text": "ops scusa"
        },
        {
          "mine": false,
          "text": "spente tranquillo"
        },
        {
          "mine": true,
          "text": "grazie mille"
        },
        {
          "mine": false,
          "text": "sempre distratto tu"
        }
      ]
    },
    {
      "name": "Rebecca",
      "messages": [
        {
          "mine": false,
          "text": "che fai sabato sera"
        },
        {
          "mine": true,
          "text": "ancora niente perché"
        },
        {
          "mine": false,
          "text": "pensavo pizza e film da me"
        },
        {
          "mine": true,
          "text": "ci sto porto io il vino"
        },
        {
          "mine": false,
          "text": "perfetto"
        }
      ]
    },
    {
      "name": "Samu",
      "messages": [
        {
          "mine": true,
          "text": "oh ma sei sparito"
        },
        {
          "mine": false,
          "text": "eh lavoro assurdo in sto periodo"
        },
        {
          "mine": true,
          "text": "ci vediamo prima o poi?"
        },
        {
          "mine": false,
          "text": "sabato prossimo giuro"
        },
        {
          "mine": true,
          "text": "segnato eh"
        }
      ]
    },
    {
      "name": "Noemi",
      "messages": [
        {
          "mine": false,
          "text": "sto tornando vuoi qualcosa dal super"
        },
        {
          "mine": true,
          "text": "si acqua che è finita"
        },
        {
          "mine": false,
          "text": "frizzante o naturale"
        },
        {
          "mine": true,
          "text": "naturale"
        },
        {
          "mine": false,
          "text": "ok"
        }
      ]
    },
    {
      "name": "Diego",
      "messages": [
        {
          "mine": false,
          "text": "domani ci alleniamo o piove"
        },
        {
          "mine": true,
          "text": "dicono che regge fino a sera"
        },
        {
          "mine": false,
          "text": "allora corriamo alle 18"
        },
        {
          "mine": true,
          "text": "ok solita strada"
        },
        {
          "mine": false,
          "text": "vai piano che ieri mi hai ammazzato"
        }
      ]
    },
    {
      "name": "mare",
      "messages": [
        {
          "mine": false,
          "text": "raga chi ha l ombrellone in macchina"
        },
        {
          "mine": true,
          "text": "io"
        },
        {
          "mine": false,
          "text": "grande porta anche il gonfiabile"
        },
        {
          "mine": true,
          "text": "quello lo prende marco"
        },
        {
          "mine": false,
          "text": "ok partenza 8 in punto"
        },
        {
          "mine": true,
          "text": "8 e mezza dai"
        }
      ]
    },
    {
      "name": "Serena",
      "messages": [
        {
          "mine": false,
          "text": "ma poi hai deciso per le vacanze"
        },
        {
          "mine": true,
          "text": "ancora no un casino di indecisione"
        },
        {
          "mine": false,
          "text": "dai buttati"
        },
        {
          "mine": true,
          "text": "tu dove vai"
        },
        {
          "mine": false,
          "text": "sud come sempre"
        }
      ]
    },
    {
      "name": "Jacopo",
      "messages": [
        {
          "mine": true,
          "text": "domani mi accompagni a prendere la macchina?"
        },
        {
          "mine": false,
          "text": "a che ora"
        },
        {
          "mine": true,
          "text": "verso le 10"
        },
        {
          "mine": false,
          "text": "ok passo io da te"
        },
        {
          "mine": true,
          "text": "sei un grande"
        }
      ]
    },
    {
      "name": "Eli",
      "messages": [
        {
          "mine": false,
          "text": "amo che facciamo stasera"
        },
        {
          "mine": true,
          "text": "boh non ho voglia di uscire"
        },
        {
          "mine": false,
          "text": "anche io a dir la verità"
        },
        {
          "mine": true,
          "text": "divano e serie?"
        },
        {
          "mine": false,
          "text": "sii vengo io da te"
        }
      ]
    },
    {
      "name": "Guido",
      "messages": [
        {
          "mine": false,
          "text": "hai visto che il campo giovedì è occupato"
        },
        {
          "mine": true,
          "text": "no e adesso"
        },
        {
          "mine": false,
          "text": "provo a spostare a mercoledì"
        },
        {
          "mine": true,
          "text": "per me va bene"
        },
        {
          "mine": false,
          "text": "ti confermo"
        }
      ]
    },
    {
      "name": "Melissa",
      "messages": [
        {
          "mine": true,
          "text": "ma tuo fratello sta meglio?"
        },
        {
          "mine": false,
          "text": "si molto meglio grazie"
        },
        {
          "mine": true,
          "text": "meno male"
        },
        {
          "mine": false,
          "text": "era solo un po di stanchezza"
        },
        {
          "mine": true,
          "text": "salutamelo"
        }
      ]
    },
    {
      "name": "Fabio",
      "messages": [
        {
          "mine": false,
          "text": "oh scusa ieri ho fatto una figuraccia"
        },
        {
          "mine": true,
          "text": "ma no dai"
        },
        {
          "mine": false,
          "text": "avevo bevuto troppo"
        },
        {
          "mine": true,
          "text": "ahah nessuno se n è accorto tranquillo"
        },
        {
          "mine": false,
          "text": "meno male"
        }
      ]
    },
    {
      "name": "Greta",
      "messages": [
        {
          "mine": false,
          "text": "domani spesa insieme?"
        },
        {
          "mine": true,
          "text": "si ho la lista lunghissima"
        },
        {
          "mine": false,
          "text": "ci mettiamo mezza giornata ahah"
        },
        {
          "mine": true,
          "text": "andiamo presto così è vuoto"
        },
        {
          "mine": false,
          "text": "ok alle 9"
        }
      ]
    },
    {
      "name": "Umberto",
      "messages": [
        {
          "mine": false,
          "text": "quel trapano me lo ridai?"
        },
        {
          "mine": true,
          "text": "vero scusa lo tenevo da secoli"
        },
        {
          "mine": false,
          "text": "ahah tranquillo"
        },
        {
          "mine": true,
          "text": "te lo porto domani"
        },
        {
          "mine": false,
          "text": "quando puoi"
        }
      ]
    },
    {
      "name": "Lidia",
      "messages": [
        {
          "mine": false,
          "text": "cara come stai"
        },
        {
          "mine": true,
          "text": "bene bene e tu"
        },
        {
          "mine": false,
          "text": "si tira avanti"
        },
        {
          "mine": true,
          "text": "passo a trovarti settimana prossima"
        },
        {
          "mine": false,
          "text": "mi fa piacere ti aspetto"
        }
      ]
    },
    {
      "name": "Rosa",
      "messages": [
        {
          "mine": false,
          "text": "hai ricevuto le foto del battesimo?"
        },
        {
          "mine": true,
          "text": "si carinissime"
        },
        {
          "mine": false,
          "text": "vero il piccolo è un amore"
        },
        {
          "mine": true,
          "text": "un giorno passo a salutarvi tutti"
        },
        {
          "mine": false,
          "text": "quando vuoi la porta è aperta"
        }
      ]
    },
    {
      "name": "Carlo",
      "messages": [
        {
          "mine": true,
          "text": "domani si gioca o annullato per pioggia"
        },
        {
          "mine": false,
          "text": "ancora non si sa"
        },
        {
          "mine": false,
          "text": "decidiamo domattina"
        },
        {
          "mine": true,
          "text": "ok tienimi aggiornato"
        },
        {
          "mine": false,
          "text": "certo"
        }
      ]
    },
    {
      "name": "Debora",
      "messages": [
        {
          "mine": false,
          "text": "ma alla fine com è finita col capo"
        },
        {
          "mine": true,
          "text": "niente ho lasciato perdere"
        },
        {
          "mine": false,
          "text": "meglio così non vale la pena"
        },
        {
          "mine": true,
          "text": "esatto"
        },
        {
          "mine": false,
          "text": "brava"
        }
      ]
    },
    {
      "name": "Kevin",
      "messages": [
        {
          "mine": true,
          "text": "raga stasera si esce o no"
        },
        {
          "mine": false,
          "text": "io sono in dubbio"
        },
        {
          "mine": true,
          "text": "dai non fare il pigro"
        },
        {
          "mine": false,
          "text": "vabbè convinto"
        },
        {
          "mine": true,
          "text": "grande ci si vede alle 22"
        }
      ]
    },
    {
      "name": "Alessia",
      "messages": [
        {
          "mine": false,
          "text": "hai il costume ancora bagnato di ieri?"
        },
        {
          "mine": true,
          "text": "si ancora appeso ahah"
        },
        {
          "mine": false,
          "text": "portalo domani che torniamo"
        },
        {
          "mine": true,
          "text": "davvero di nuovo?"
        },
        {
          "mine": false,
          "text": "sii che c è il sole"
        }
      ]
    },
    {
      "name": "trekking",
      "messages": [
        {
          "mine": false,
          "text": "domenica sentiero facile o quello lungo"
        },
        {
          "mine": true,
          "text": "facile ti prego"
        },
        {
          "mine": false,
          "text": "eh pigrona"
        },
        {
          "mine": false,
          "text": "va bene facile ma partenza presto"
        },
        {
          "mine": true,
          "text": "quanto presto"
        },
        {
          "mine": false,
          "text": "7"
        },
        {
          "mine": true,
          "text": "no vabbè ci ripenso"
        }
      ]
    },
    {
      "name": "Gabriele",
      "messages": [
        {
          "mine": false,
          "text": "hai preso tu le chiavi del box?"
        },
        {
          "mine": true,
          "text": "no le hai tu"
        },
        {
          "mine": false,
          "text": "controllo... ah si scusa"
        },
        {
          "mine": true,
          "text": "ahah sempre così"
        },
        {
          "mine": false,
          "text": "vabbè trovate"
        }
      ]
    },
    {
      "name": "Irene",
      "messages": [
        {
          "mine": true,
          "text": "ma domani vieni in centro con me?"
        },
        {
          "mine": false,
          "text": "per fare cosa"
        },
        {
          "mine": true,
          "text": "devo cercare un vestito e senza di te non decido"
        },
        {
          "mine": false,
          "text": "ahah ok vengo"
        },
        {
          "mine": true,
          "text": "sei la migliore"
        }
      ]
    },
    {
      "name": "Nina",
      "messages": [
        {
          "mine": false,
          "text": "che sonno oggi non mi reggo"
        },
        {
          "mine": true,
          "text": "idem caffè triplo"
        },
        {
          "mine": false,
          "text": "ci vorrebbe una vacanza"
        },
        {
          "mine": true,
          "text": "sempre"
        },
        {
          "mine": false,
          "text": "ahah"
        }
      ]
    },
    {
      "name": "Cesco",
      "messages": [
        {
          "mine": true,
          "text": "oh domani mi dai un passaggio?"
        },
        {
          "mine": false,
          "text": "dove devi andare"
        },
        {
          "mine": true,
          "text": "in stazione verso le 7"
        },
        {
          "mine": false,
          "text": "presto ma ok passo io"
        },
        {
          "mine": true,
          "text": "grazie mille davvero"
        }
      ]
    },
    {
      "name": "Aurora",
      "messages": [
        {
          "mine": false,
          "text": "hai visto che ha scritto nel gruppo"
        },
        {
          "mine": true,
          "text": "no che ha detto"
        },
        {
          "mine": false,
          "text": "vai a leggere è assurdo ahah"
        },
        {
          "mine": true,
          "text": "ok aspetta"
        },
        {
          "mine": false,
          "text": "poi ne parliamo"
        }
      ]
    },
    {
      "name": "Tobia",
      "messages": [
        {
          "mine": false,
          "text": "domani porti tu il cane al parco o io"
        },
        {
          "mine": true,
          "text": "tocca a me lo so"
        },
        {
          "mine": false,
          "text": "grazie perché io crollo"
        },
        {
          "mine": true,
          "text": "tranquillo dormi"
        },
        {
          "mine": false,
          "text": "sei un tesoro"
        }
      ]
    },
    {
      "name": "amo",
      "messages": [
        {
          "mine": false,
          "text": "a che ora torni"
        },
        {
          "mine": true,
          "text": "verso le 8 penso"
        },
        {
          "mine": false,
          "text": "ok metto su la pasta per le 8 e mezza"
        },
        {
          "mine": true,
          "text": "perfetto muoio di fame"
        },
        {
          "mine": false,
          "text": "corri a casa allora"
        },
        {
          "mine": true,
          "text": "❤️"
        }
      ]
    }
  ],
  "pt": [
    {
      "name": "Beatriz",
      "messages": [
        {
          "mine": false,
          "text": "vens hoje ou n"
        },
        {
          "mine": true,
          "text": "acho q sim"
        },
        {
          "mine": true,
          "text": "a q horas era"
        },
        {
          "mine": false,
          "text": "8 e meia no de sempre"
        },
        {
          "mine": true,
          "text": "fixe tou lá"
        },
        {
          "mine": false,
          "text": "nao te atrases pah"
        }
      ]
    },
    {
      "name": "João",
      "messages": [
        {
          "mine": true,
          "text": "viste o jogo ontem"
        },
        {
          "mine": false,
          "text": "nem me fales"
        },
        {
          "mine": false,
          "text": "foi uma vergonha"
        },
        {
          "mine": true,
          "text": "ahah eu adormeci ao intervalo"
        },
        {
          "mine": false,
          "text": "fizeste bem"
        }
      ]
    },
    {
      "name": "Inês",
      "messages": [
        {
          "mine": false,
          "text": "ja acordaste"
        },
        {
          "mine": true,
          "text": "agora"
        },
        {
          "mine": false,
          "text": "morta"
        },
        {
          "mine": false,
          "text": "ontem foi demais"
        },
        {
          "mine": true,
          "text": "quem me trouxe a casa"
        },
        {
          "mine": false,
          "text": "o tiago ahah nem te lembras"
        },
        {
          "mine": true,
          "text": "meu deus"
        }
      ]
    },
    {
      "name": "Rui",
      "messages": [
        {
          "mine": false,
          "text": "tas onde"
        },
        {
          "mine": true,
          "text": "ainda em casa"
        },
        {
          "mine": false,
          "text": "pa despacha"
        },
        {
          "mine": true,
          "text": "5 min"
        },
        {
          "mine": false,
          "text": "dizes sempre isso"
        }
      ]
    },
    {
      "name": "Mariana",
      "messages": [
        {
          "mine": true,
          "text": "gostei imenso daquele sitio"
        },
        {
          "mine": false,
          "text": "eu tb"
        },
        {
          "mine": false,
          "text": "temos de voltar"
        },
        {
          "mine": true,
          "text": "sim mas sem o rui ahah"
        },
        {
          "mine": false,
          "text": "coitado do rui"
        }
      ]
    },
    {
      "name": "Zé",
      "messages": [
        {
          "mine": false,
          "text": "boas"
        },
        {
          "mine": false,
          "text": "tens carro amanha"
        },
        {
          "mine": true,
          "text": "tenho pq"
        },
        {
          "mine": false,
          "text": "davas me boleia ate a estacao"
        },
        {
          "mine": true,
          "text": "a q horas"
        },
        {
          "mine": false,
          "text": "9"
        },
        {
          "mine": true,
          "text": "ok mas ja prontos"
        }
      ]
    },
    {
      "name": "Manel",
      "messages": [
        {
          "mine": true,
          "text": "meu esqueci o carregador em tua casa"
        },
        {
          "mine": false,
          "text": "sim tá aqui"
        },
        {
          "mine": false,
          "text": "queres q leve amanha"
        },
        {
          "mine": true,
          "text": "se puderes"
        },
        {
          "mine": false,
          "text": "fica descansado"
        }
      ]
    },
    {
      "name": "Kika",
      "messages": [
        {
          "mine": false,
          "text": "viste as fotos"
        },
        {
          "mine": true,
          "text": "quais"
        },
        {
          "mine": false,
          "text": "as de sabado"
        },
        {
          "mine": false,
          "text": "mandei no grupo"
        },
        {
          "mine": true,
          "text": "ah ja vi ahah estamos horriveis"
        },
        {
          "mine": false,
          "text": "fala por ti"
        }
      ]
    },
    {
      "name": "Tó",
      "messages": [
        {
          "mine": false,
          "text": "amanha treino ou n"
        },
        {
          "mine": true,
          "text": "n consigo tenho coisas"
        },
        {
          "mine": false,
          "text": "outra vez"
        },
        {
          "mine": true,
          "text": "pa desculpa"
        },
        {
          "mine": false,
          "text": "na quinta entao"
        }
      ]
    },
    {
      "name": "Ana facul",
      "messages": [
        {
          "mine": false,
          "text": "entregaste o trabalho"
        },
        {
          "mine": true,
          "text": "ainda n"
        },
        {
          "mine": true,
          "text": "falta me a conclusao"
        },
        {
          "mine": false,
          "text": "e pra hoje"
        },
        {
          "mine": true,
          "text": "eu sei eu sei"
        },
        {
          "mine": false,
          "text": "boa sorte ahah"
        }
      ]
    },
    {
      "name": "Jorge casa",
      "messages": [
        {
          "mine": false,
          "text": "acabou o papel higienico"
        },
        {
          "mine": true,
          "text": "outra vez"
        },
        {
          "mine": false,
          "text": "quem gastou n fui eu"
        },
        {
          "mine": true,
          "text": "compro à tarde"
        },
        {
          "mine": false,
          "text": "obg"
        }
      ]
    },
    {
      "name": "Max trampo",
      "messages": [
        {
          "mine": false,
          "text": "chegaste"
        },
        {
          "mine": true,
          "text": "estou no comboio"
        },
        {
          "mine": true,
          "text": "5 min"
        },
        {
          "mine": false,
          "text": "o chefe ja perguntou por ti"
        },
        {
          "mine": true,
          "text": "diz q vou a caminho"
        },
        {
          "mine": false,
          "text": "ta"
        }
      ]
    },
    {
      "name": "Sara ginásio",
      "messages": [
        {
          "mine": true,
          "text": "vais hj"
        },
        {
          "mine": false,
          "text": "sim pernas"
        },
        {
          "mine": true,
          "text": "credo"
        },
        {
          "mine": false,
          "text": "anda la nao sejas mole"
        },
        {
          "mine": true,
          "text": "ok ok vou"
        }
      ]
    },
    {
      "name": "Rita ❤️",
      "messages": [
        {
          "mine": false,
          "text": "ja tou com saudades"
        },
        {
          "mine": true,
          "text": "sai a 2h"
        },
        {
          "mine": true,
          "text": "levo jantar"
        },
        {
          "mine": false,
          "text": "aiii amor"
        },
        {
          "mine": false,
          "text": "traz daquele tinto"
        },
        {
          "mine": true,
          "text": "combinado"
        }
      ]
    },
    {
      "name": "Mãe",
      "messages": [
        {
          "mine": false,
          "text": "almoças ca no domingo"
        },
        {
          "mine": true,
          "text": "sim mãe"
        },
        {
          "mine": false,
          "text": "trazes a roupa pra lavar"
        },
        {
          "mine": true,
          "text": "ahah nao é preciso"
        },
        {
          "mine": false,
          "text": "traz na mesma"
        },
        {
          "mine": true,
          "text": "ta bem"
        }
      ]
    },
    {
      "name": "Pai",
      "messages": [
        {
          "mine": true,
          "text": "pai o carro ta a fazer um barulho estranho"
        },
        {
          "mine": false,
          "text": "que tipo de barulho"
        },
        {
          "mine": true,
          "text": "sei la um chiar quando travo"
        },
        {
          "mine": false,
          "text": "passa ca no fim de semana q eu vejo"
        },
        {
          "mine": true,
          "text": "obg"
        }
      ]
    },
    {
      "name": "Avó",
      "messages": [
        {
          "mine": false,
          "text": "ja comeste menino"
        },
        {
          "mine": true,
          "text": "sim avó ahah"
        },
        {
          "mine": false,
          "text": "estas muito magro"
        },
        {
          "mine": true,
          "text": "estou bem prometo"
        },
        {
          "mine": false,
          "text": "aparece ca q faço sopa"
        }
      ]
    },
    {
      "name": "Avô",
      "messages": [
        {
          "mine": false,
          "text": "vem o benfica jogar hoje"
        },
        {
          "mine": true,
          "text": "vem sim avô às 8"
        },
        {
          "mine": false,
          "text": "vemos juntos"
        },
        {
          "mine": true,
          "text": "eu levo os tremoços"
        },
        {
          "mine": false,
          "text": "boa"
        }
      ]
    },
    {
      "name": "as gajas",
      "messages": [
        {
          "mine": false,
          "text": "meninas jantar sexta"
        },
        {
          "mine": false,
          "text": "onde"
        },
        {
          "mine": true,
          "text": "aquele novo do centro?"
        },
        {
          "mine": false,
          "text": "eu alinho"
        },
        {
          "mine": false,
          "text": "eu tb mas cedo q tenho de acordar"
        },
        {
          "mine": true,
          "text": "marco mesa pra 4"
        },
        {
          "mine": false,
          "text": "top"
        }
      ]
    },
    {
      "name": "família",
      "messages": [
        {
          "mine": false,
          "text": "aniversario do avo é domingo"
        },
        {
          "mine": false,
          "text": "quem leva o bolo"
        },
        {
          "mine": true,
          "text": "eu trato do bolo"
        },
        {
          "mine": false,
          "text": "e eu levo as bebidas"
        },
        {
          "mine": false,
          "text": "as 13h em casa da mae"
        },
        {
          "mine": true,
          "text": "combinado"
        }
      ]
    },
    {
      "name": "casa",
      "messages": [
        {
          "mine": false,
          "text": "quem deixou a loica na banca"
        },
        {
          "mine": true,
          "text": "eu lavo à noite juro"
        },
        {
          "mine": false,
          "text": "dizes sempre"
        },
        {
          "mine": false,
          "text": "a renda é amanha btw"
        },
        {
          "mine": true,
          "text": "ah bolas ja transfiro"
        }
      ]
    },
    {
      "name": "futebol",
      "messages": [
        {
          "mine": false,
          "text": "quem joga quinta"
        },
        {
          "mine": true,
          "text": "eu vou"
        },
        {
          "mine": false,
          "text": "eu tb"
        },
        {
          "mine": false,
          "text": "faltam 2 pra 5x5"
        },
        {
          "mine": true,
          "text": "chamo o zé"
        },
        {
          "mine": false,
          "text": "boa mesmo campo de sempre"
        }
      ]
    },
    {
      "name": "malta",
      "messages": [
        {
          "mine": false,
          "text": "praia no sabado quem alinha"
        },
        {
          "mine": true,
          "text": "euu"
        },
        {
          "mine": false,
          "text": "se n chover"
        },
        {
          "mine": false,
          "text": "dizem q vem sol"
        },
        {
          "mine": true,
          "text": "levo a coluna"
        },
        {
          "mine": false,
          "text": "e a bola"
        }
      ]
    },
    {
      "name": "Diogo",
      "messages": [
        {
          "mine": true,
          "text": "meu emprestas me o carregador do portatil"
        },
        {
          "mine": false,
          "text": "qual o teu ta a dar mal?"
        },
        {
          "mine": true,
          "text": "morreu de vez"
        },
        {
          "mine": false,
          "text": "passa ca depois busca"
        },
        {
          "mine": true,
          "text": "top vou já"
        }
      ]
    },
    {
      "name": "Catarina",
      "messages": [
        {
          "mine": false,
          "text": "adivinha quem vi no supermercado"
        },
        {
          "mine": true,
          "text": "quem"
        },
        {
          "mine": false,
          "text": "o ex da joana"
        },
        {
          "mine": true,
          "text": "naoo"
        },
        {
          "mine": false,
          "text": "com outra"
        },
        {
          "mine": true,
          "text": "conta me tudo ao telefone"
        }
      ]
    },
    {
      "name": "Miguel",
      "messages": [
        {
          "mine": false,
          "text": "onde compraste aqueles tenis"
        },
        {
          "mine": true,
          "text": "online"
        },
        {
          "mine": true,
          "text": "mando te o link"
        },
        {
          "mine": false,
          "text": "eram caros?"
        },
        {
          "mine": true,
          "text": "estavam em saldos"
        },
        {
          "mine": false,
          "text": "fixe"
        }
      ]
    },
    {
      "name": "Filipa",
      "messages": [
        {
          "mine": true,
          "text": "tas melhor da constipacao"
        },
        {
          "mine": false,
          "text": "mais ou menos"
        },
        {
          "mine": false,
          "text": "ainda com o nariz entupido"
        },
        {
          "mine": true,
          "text": "descansa e bebe cha"
        },
        {
          "mine": false,
          "text": "sim mãe ahah"
        }
      ]
    },
    {
      "name": "Pedro",
      "messages": [
        {
          "mine": false,
          "text": "afinal vamos ou n ao concerto"
        },
        {
          "mine": true,
          "text": "os bilhetes ta caros pa"
        },
        {
          "mine": false,
          "text": "pois"
        },
        {
          "mine": true,
          "text": "vamos ao proximo"
        },
        {
          "mine": false,
          "text": "ok"
        }
      ]
    },
    {
      "name": "Carolina",
      "messages": [
        {
          "mine": false,
          "text": "gostas deste vestido"
        },
        {
          "mine": false,
          "text": "pro casamento"
        },
        {
          "mine": true,
          "text": "adoro"
        },
        {
          "mine": true,
          "text": "esse azul fica te muito bem"
        },
        {
          "mine": false,
          "text": "aii obg era o q precisava ouvir"
        }
      ]
    },
    {
      "name": "Tiago",
      "messages": [
        {
          "mine": true,
          "text": "afinal quem ganhou a aposta"
        },
        {
          "mine": false,
          "text": "eu obviamente"
        },
        {
          "mine": true,
          "text": "ahah nem penses"
        },
        {
          "mine": false,
          "text": "deves me um jantar"
        },
        {
          "mine": true,
          "text": "sonha"
        }
      ]
    },
    {
      "name": "Leonor",
      "messages": [
        {
          "mine": false,
          "text": "tas acordada?"
        },
        {
          "mine": true,
          "text": "sim n consigo dormir"
        },
        {
          "mine": false,
          "text": "eu tb"
        },
        {
          "mine": false,
          "text": "amanha vai ser dificil"
        },
        {
          "mine": true,
          "text": "nem me fales"
        }
      ]
    },
    {
      "name": "Gonçalo",
      "messages": [
        {
          "mine": false,
          "text": "trouxeste a prancha"
        },
        {
          "mine": true,
          "text": "sim ta no carro"
        },
        {
          "mine": false,
          "text": "boa ondas grandes hj"
        },
        {
          "mine": true,
          "text": "chego em 20"
        },
        {
          "mine": false,
          "text": "tou no parque de cima"
        }
      ]
    },
    {
      "name": "Matilde",
      "messages": [
        {
          "mine": true,
          "text": "aquele filme q me recomendaste"
        },
        {
          "mine": false,
          "text": "sim"
        },
        {
          "mine": true,
          "text": "chorei baldes"
        },
        {
          "mine": false,
          "text": "ahah eu avisei"
        },
        {
          "mine": true,
          "text": "nao avisaste nada"
        }
      ]
    },
    {
      "name": "Francisco",
      "messages": [
        {
          "mine": false,
          "text": "vais a run amanha de manha"
        },
        {
          "mine": true,
          "text": "a q horas"
        },
        {
          "mine": false,
          "text": "7h antes do trabalho"
        },
        {
          "mine": true,
          "text": "7 é cedo demais pa"
        },
        {
          "mine": false,
          "text": "mole"
        },
        {
          "mine": true,
          "text": "8 e vou"
        }
      ]
    },
    {
      "name": "Margarida",
      "messages": [
        {
          "mine": false,
          "text": "esqueci as chaves em casa"
        },
        {
          "mine": true,
          "text": "outra vez margarida"
        },
        {
          "mine": false,
          "text": "podes vir abrir"
        },
        {
          "mine": true,
          "text": "to a chegar espera ai"
        },
        {
          "mine": false,
          "text": "obg salvaste me"
        }
      ]
    },
    {
      "name": "André",
      "messages": [
        {
          "mine": true,
          "text": "afinal fechaste o negocio"
        },
        {
          "mine": false,
          "text": "sim assinaram hoje"
        },
        {
          "mine": true,
          "text": "boaaa parabens"
        },
        {
          "mine": false,
          "text": "obg mano foi stress"
        },
        {
          "mine": true,
          "text": "temos de celebrar"
        }
      ]
    },
    {
      "name": "Sofia",
      "messages": [
        {
          "mine": false,
          "text": "levas me algo da padaria"
        },
        {
          "mine": true,
          "text": "vou passar la sim"
        },
        {
          "mine": false,
          "text": "um pao de deus por favor"
        },
        {
          "mine": true,
          "text": "so um?"
        },
        {
          "mine": false,
          "text": "traz dois ahah"
        }
      ]
    },
    {
      "name": "Ricardo",
      "messages": [
        {
          "mine": false,
          "text": "meu passa me os apontamentos"
        },
        {
          "mine": true,
          "text": "de q cadeira"
        },
        {
          "mine": false,
          "text": "a de terca faltei"
        },
        {
          "mine": true,
          "text": "tiro foto e mando"
        },
        {
          "mine": false,
          "text": "salvas me a vida"
        }
      ]
    },
    {
      "name": "Joana",
      "messages": [
        {
          "mine": false,
          "text": "acabei tudo com o rui"
        },
        {
          "mine": true,
          "text": "o que"
        },
        {
          "mine": true,
          "text": "quando"
        },
        {
          "mine": false,
          "text": "ontem à noite"
        },
        {
          "mine": false,
          "text": "depois conto"
        },
        {
          "mine": true,
          "text": "queres q va ai"
        },
        {
          "mine": false,
          "text": "vem"
        }
      ]
    },
    {
      "name": "Bruno",
      "messages": [
        {
          "mine": true,
          "text": "tas em casa"
        },
        {
          "mine": false,
          "text": "to pq"
        },
        {
          "mine": true,
          "text": "vou ai buscar aquilo"
        },
        {
          "mine": false,
          "text": "ta a porta ta aberta"
        },
        {
          "mine": true,
          "text": "5 min"
        }
      ]
    },
    {
      "name": "Vasco",
      "messages": [
        {
          "mine": false,
          "text": "afinal é onde o jantar"
        },
        {
          "mine": true,
          "text": "casa da bea"
        },
        {
          "mine": false,
          "text": "levo o q"
        },
        {
          "mine": true,
          "text": "sobremesa se puderes"
        },
        {
          "mine": false,
          "text": "trato disso"
        }
      ]
    },
    {
      "name": "Madalena",
      "messages": [
        {
          "mine": false,
          "text": "vi hj uma coisa q ias adorar"
        },
        {
          "mine": true,
          "text": "o que"
        },
        {
          "mine": false,
          "text": "uns brincos iguais aos q querias"
        },
        {
          "mine": true,
          "text": "onde"
        },
        {
          "mine": false,
          "text": "mando foto"
        }
      ]
    },
    {
      "name": "Nuno",
      "messages": [
        {
          "mine": true,
          "text": "o wifi ta a ir a baixo ai tb?"
        },
        {
          "mine": false,
          "text": "sim n dá nada"
        },
        {
          "mine": false,
          "text": "ligaste a reiniciar o router"
        },
        {
          "mine": true,
          "text": "ja fiz na mesma"
        },
        {
          "mine": false,
          "text": "boa sorte entao ahah"
        }
      ]
    },
    {
      "name": "Raquel",
      "messages": [
        {
          "mine": false,
          "text": "cheguei bem"
        },
        {
          "mine": true,
          "text": "boa avisa sempre"
        },
        {
          "mine": false,
          "text": "foi uma viagem enorme"
        },
        {
          "mine": true,
          "text": "descansa"
        },
        {
          "mine": false,
          "text": "bjs falamos amanha"
        }
      ]
    },
    {
      "name": "Hugo",
      "messages": [
        {
          "mine": false,
          "text": "meu aquela serie acabou mesmo assim?"
        },
        {
          "mine": true,
          "text": "sim pah que final"
        },
        {
          "mine": false,
          "text": "fiquei em choque"
        },
        {
          "mine": true,
          "text": "nem eu acredito"
        },
        {
          "mine": false,
          "text": "vao fazer 2a temporada?"
        }
      ]
    },
    {
      "name": "Cláudia",
      "messages": [
        {
          "mine": true,
          "text": "obrigada por ontem"
        },
        {
          "mine": false,
          "text": "de nada foi um gosto"
        },
        {
          "mine": false,
          "text": "precisavas de desabafar"
        },
        {
          "mine": true,
          "text": "precisava mesmo"
        },
        {
          "mine": false,
          "text": "tou sempre ca"
        }
      ]
    },
    {
      "name": "Fábio",
      "messages": [
        {
          "mine": false,
          "text": "vens ver o jogo a minha casa"
        },
        {
          "mine": true,
          "text": "a q horas"
        },
        {
          "mine": false,
          "text": "vem mais cedo pra petiscar"
        },
        {
          "mine": true,
          "text": "levo cervejas"
        },
        {
          "mine": false,
          "text": "meu forte"
        }
      ]
    },
    {
      "name": "Daniela",
      "messages": [
        {
          "mine": false,
          "text": "consegues me trocar o turno de sabado"
        },
        {
          "mine": true,
          "text": "sabado n consigo tenho coisa de familia"
        },
        {
          "mine": false,
          "text": "bua"
        },
        {
          "mine": true,
          "text": "domingo posso"
        },
        {
          "mine": false,
          "text": "ok vou tentar arranjar"
        }
      ]
    },
    {
      "name": "Rúben",
      "messages": [
        {
          "mine": true,
          "text": "afinal vieste ontem?"
        },
        {
          "mine": false,
          "text": "nao adormeci no sofa"
        },
        {
          "mine": true,
          "text": "ahah classico"
        },
        {
          "mine": false,
          "text": "acordei à 1 da manha"
        },
        {
          "mine": true,
          "text": "perdeste bue"
        }
      ]
    },
    {
      "name": "Marta",
      "messages": [
        {
          "mine": false,
          "text": "ja escolheste o presente da mae"
        },
        {
          "mine": true,
          "text": "ainda n tas com ideias?"
        },
        {
          "mine": false,
          "text": "pensei numa camisola"
        },
        {
          "mine": true,
          "text": "boa dividimos"
        },
        {
          "mine": false,
          "text": "combinado"
        }
      ]
    },
    {
      "name": "Zé facul",
      "messages": [
        {
          "mine": false,
          "text": "a q horas é o exame"
        },
        {
          "mine": true,
          "text": "10h sala 3"
        },
        {
          "mine": false,
          "text": "estudaste?"
        },
        {
          "mine": true,
          "text": "mais ou menos e tu"
        },
        {
          "mine": false,
          "text": "nem por isso ahah rip"
        }
      ]
    },
    {
      "name": "Kiko",
      "messages": [
        {
          "mine": true,
          "text": "vens jantar ou ficas a jogar"
        },
        {
          "mine": false,
          "text": "so mais uma ranked"
        },
        {
          "mine": true,
          "text": "dizes sempre isso"
        },
        {
          "mine": false,
          "text": "prometo"
        },
        {
          "mine": true,
          "text": "conto ate 10"
        }
      ]
    },
    {
      "name": "Bea",
      "messages": [
        {
          "mine": false,
          "text": "onde meteste as minhas chaves"
        },
        {
          "mine": true,
          "text": "eu? n peguei nelas"
        },
        {
          "mine": false,
          "text": "estavam na mesa"
        },
        {
          "mine": true,
          "text": "olha no bolso do casaco"
        },
        {
          "mine": false,
          "text": "achei ahah desculpa"
        }
      ]
    },
    {
      "name": "Nando",
      "messages": [
        {
          "mine": false,
          "text": "boa esse golo ontem viste"
        },
        {
          "mine": true,
          "text": "que coisa linda"
        },
        {
          "mine": false,
          "text": "repeti umas 10 vezes"
        },
        {
          "mine": true,
          "text": "ahah eu tb"
        }
      ]
    },
    {
      "name": "Xana",
      "messages": [
        {
          "mine": true,
          "text": "cortaste o cabelo?"
        },
        {
          "mine": false,
          "text": "simm ontem"
        },
        {
          "mine": true,
          "text": "ficou giro"
        },
        {
          "mine": false,
          "text": "achas? tava com medo"
        },
        {
          "mine": true,
          "text": "ta muito bom a serio"
        }
      ]
    },
    {
      "name": "Guida",
      "messages": [
        {
          "mine": false,
          "text": "chegas a q horas amanha"
        },
        {
          "mine": true,
          "text": "comboio das 11"
        },
        {
          "mine": false,
          "text": "vou te buscar a estacao"
        },
        {
          "mine": true,
          "text": "n precisas apanho o bus"
        },
        {
          "mine": false,
          "text": "nada disso vou eu"
        }
      ]
    },
    {
      "name": "Vera",
      "messages": [
        {
          "mine": false,
          "text": "aquela receita q fizeste"
        },
        {
          "mine": true,
          "text": "a do frango?"
        },
        {
          "mine": false,
          "text": "sim manda me"
        },
        {
          "mine": true,
          "text": "mando quando chegar a casa"
        },
        {
          "mine": false,
          "text": "obg quero fazer hj"
        }
      ]
    },
    {
      "name": "Duarte",
      "messages": [
        {
          "mine": true,
          "text": "meu perdi a carteira acho eu"
        },
        {
          "mine": false,
          "text": "onde foste"
        },
        {
          "mine": true,
          "text": "tavamos naquele bar"
        },
        {
          "mine": false,
          "text": "liga la a perguntar"
        },
        {
          "mine": true,
          "text": "ja liguei acham q a tem"
        },
        {
          "mine": false,
          "text": "ufa"
        }
      ]
    },
    {
      "name": "Constança",
      "messages": [
        {
          "mine": false,
          "text": "amanha vais de carro?"
        },
        {
          "mine": true,
          "text": "sim queres boleia"
        },
        {
          "mine": false,
          "text": "se der jeito"
        },
        {
          "mine": true,
          "text": "passo por ti as 8:45"
        },
        {
          "mine": false,
          "text": "top obg"
        }
      ]
    },
    {
      "name": "Afonso",
      "messages": [
        {
          "mine": false,
          "text": "tas a ver isto de futebol fantasy"
        },
        {
          "mine": true,
          "text": "to a montar a equipa"
        },
        {
          "mine": false,
          "text": "poe o avancado do porto"
        },
        {
          "mine": true,
          "text": "ja pus"
        },
        {
          "mine": false,
          "text": "boa vamos ganhar a liga interna"
        }
      ]
    },
    {
      "name": "Bárbara",
      "messages": [
        {
          "mine": true,
          "text": "tas livre pra cafe amanha"
        },
        {
          "mine": false,
          "text": "de manha n de tarde sim"
        },
        {
          "mine": true,
          "text": "as 4?"
        },
        {
          "mine": false,
          "text": "no de sempre"
        },
        {
          "mine": true,
          "text": "combinado"
        }
      ]
    },
    {
      "name": "Salvador",
      "messages": [
        {
          "mine": false,
          "text": "meu ficaste com a minha jaqueta"
        },
        {
          "mine": true,
          "text": "ah sim desculpa troquei"
        },
        {
          "mine": false,
          "text": "ahah eu sabia"
        },
        {
          "mine": true,
          "text": "levo amanha"
        },
        {
          "mine": false,
          "text": "fixe"
        }
      ]
    },
    {
      "name": "Teresa",
      "messages": [
        {
          "mine": false,
          "text": "consegues me ligar quando puderes"
        },
        {
          "mine": true,
          "text": "ta tudo bem?"
        },
        {
          "mine": false,
          "text": "sim so uma cena rapida"
        },
        {
          "mine": true,
          "text": "ligo em 10 min tou a acabar uma coisa"
        },
        {
          "mine": false,
          "text": "sem stress"
        }
      ]
    },
    {
      "name": "Martim",
      "messages": [
        {
          "mine": true,
          "text": "vens ao ginasio de manha"
        },
        {
          "mine": false,
          "text": "que dor de costas pah"
        },
        {
          "mine": true,
          "text": "levantaste mal ontem"
        },
        {
          "mine": false,
          "text": "provavelmente"
        },
        {
          "mine": true,
          "text": "descansa entao"
        }
      ]
    },
    {
      "name": "Benedita",
      "messages": [
        {
          "mine": false,
          "text": "tas a usar o carregador do carro?"
        },
        {
          "mine": true,
          "text": "n ta em casa"
        },
        {
          "mine": false,
          "text": "posso ir buscar"
        },
        {
          "mine": true,
          "text": "claro"
        },
        {
          "mine": false,
          "text": "obg passo ai logo"
        }
      ]
    },
    {
      "name": "Lourenço",
      "messages": [
        {
          "mine": false,
          "text": "afinal alugamos aquela casa pro verao?"
        },
        {
          "mine": true,
          "text": "quanto era por noite"
        },
        {
          "mine": false,
          "text": "dividido por 6 fica barato"
        },
        {
          "mine": true,
          "text": "entao alinho"
        },
        {
          "mine": false,
          "text": "boa reservo ja"
        }
      ]
    },
    {
      "name": "Alice",
      "messages": [
        {
          "mine": true,
          "text": "gostei tanto da tua casa nova"
        },
        {
          "mine": false,
          "text": "obg ainda falta muito"
        },
        {
          "mine": false,
          "text": "as caixas por todo o lado"
        },
        {
          "mine": true,
          "text": "ajudo te no fim de semana"
        },
        {
          "mine": false,
          "text": "serias um anjo"
        }
      ]
    },
    {
      "name": "Simão",
      "messages": [
        {
          "mine": false,
          "text": "meu marcaste a viagem?"
        },
        {
          "mine": true,
          "text": "ainda n os voos tao caros"
        },
        {
          "mine": false,
          "text": "espera q eu vi mais baratos"
        },
        {
          "mine": true,
          "text": "manda"
        },
        {
          "mine": false,
          "text": "ja te envio"
        }
      ]
    },
    {
      "name": "Camila",
      "messages": [
        {
          "mine": false,
          "text": "ai q dia horrivel"
        },
        {
          "mine": true,
          "text": "o que aconteceu"
        },
        {
          "mine": false,
          "text": "tudo correu mal no trabalho"
        },
        {
          "mine": true,
          "text": "queres desabafar?"
        },
        {
          "mine": false,
          "text": "depois ligo te"
        }
      ]
    },
    {
      "name": "Gui",
      "messages": [
        {
          "mine": true,
          "text": "trouxeste a coluna?"
        },
        {
          "mine": false,
          "text": "esqueci pah"
        },
        {
          "mine": true,
          "text": "serio"
        },
        {
          "mine": false,
          "text": "volto a buscar"
        },
        {
          "mine": true,
          "text": "nao ja n vale a pena"
        }
      ]
    },
    {
      "name": "Pipa",
      "messages": [
        {
          "mine": false,
          "text": "viste a hora?"
        },
        {
          "mine": true,
          "text": "sim to a sair"
        },
        {
          "mine": false,
          "text": "corre q perdemos a sessao"
        },
        {
          "mine": true,
          "text": "vou a correr"
        },
        {
          "mine": false,
          "text": "guardo te lugar"
        }
      ]
    },
    {
      "name": "Bino",
      "messages": [
        {
          "mine": false,
          "text": "meu o teu cao ta a ladrar ha 1h"
        },
        {
          "mine": true,
          "text": "eii desculpa ja tou a chegar"
        },
        {
          "mine": false,
          "text": "ta descansa"
        },
        {
          "mine": true,
          "text": "ele fica ansioso sozinho"
        },
        {
          "mine": false,
          "text": "coitado"
        }
      ]
    },
    {
      "name": "Guto",
      "messages": [
        {
          "mine": true,
          "text": "afinal foste ao treino?"
        },
        {
          "mine": false,
          "text": "fui ta tudo bem"
        },
        {
          "mine": true,
          "text": "boa fiquei na duvida"
        },
        {
          "mine": false,
          "text": "era so preguica ahah"
        },
        {
          "mine": true,
          "text": "conheco bem isso"
        }
      ]
    },
    {
      "name": "Rita ginásio",
      "messages": [
        {
          "mine": false,
          "text": "aula de spinning amanha vens?"
        },
        {
          "mine": true,
          "text": "a q horas"
        },
        {
          "mine": false,
          "text": "19h"
        },
        {
          "mine": true,
          "text": "essa mata"
        },
        {
          "mine": false,
          "text": "por isso é q é boa"
        }
      ]
    },
    {
      "name": "Ana M",
      "messages": [
        {
          "mine": false,
          "text": "afinal casas em setembro?"
        },
        {
          "mine": true,
          "text": "sim dia 12"
        },
        {
          "mine": false,
          "text": "ai q emocao"
        },
        {
          "mine": true,
          "text": "tou nervosa ja"
        },
        {
          "mine": false,
          "text": "vai correr tudo bem"
        }
      ]
    },
    {
      "name": "Zeca",
      "messages": [
        {
          "mine": true,
          "text": "vens ver o jogo ou n"
        },
        {
          "mine": false,
          "text": "tou de castigo em casa a estudar"
        },
        {
          "mine": true,
          "text": "ahah coitado"
        },
        {
          "mine": false,
          "text": "manda o resultado"
        },
        {
          "mine": true,
          "text": "vou mandando"
        }
      ]
    },
    {
      "name": "Mimi",
      "messages": [
        {
          "mine": false,
          "text": "ja viste as ferias q marquei"
        },
        {
          "mine": true,
          "text": "onde vais"
        },
        {
          "mine": false,
          "text": "grecia em agosto"
        },
        {
          "mine": true,
          "text": "q inveja"
        },
        {
          "mine": false,
          "text": "anda comigo ahah"
        }
      ]
    },
    {
      "name": "Tomás",
      "messages": [
        {
          "mine": false,
          "text": "meu esse gajo respondeu?"
        },
        {
          "mine": true,
          "text": "ainda n"
        },
        {
          "mine": false,
          "text": "que mal educado"
        },
        {
          "mine": true,
          "text": "pois eu tb achei"
        },
        {
          "mine": false,
          "text": "esquece"
        }
      ]
    },
    {
      "name": "Íris",
      "messages": [
        {
          "mine": true,
          "text": "adorei a foto q puseste hoje"
        },
        {
          "mine": false,
          "text": "aii obg"
        },
        {
          "mine": false,
          "text": "demorei imenso a editar"
        },
        {
          "mine": true,
          "text": "nota se o cuidado"
        },
        {
          "mine": false,
          "text": "querida"
        }
      ]
    },
    {
      "name": "David",
      "messages": [
        {
          "mine": false,
          "text": "vamos correr no domingo?"
        },
        {
          "mine": true,
          "text": "quantos km"
        },
        {
          "mine": false,
          "text": "uns 10 leve"
        },
        {
          "mine": true,
          "text": "10 leve ahah ok"
        },
        {
          "mine": false,
          "text": "8h no parque"
        }
      ]
    },
    {
      "name": "Lara",
      "messages": [
        {
          "mine": false,
          "text": "podes regar as minhas plantas enquanto tou fora"
        },
        {
          "mine": true,
          "text": "claro deixa a chave onde?"
        },
        {
          "mine": false,
          "text": "debaixo do tapete como sempre"
        },
        {
          "mine": true,
          "text": "ok trato disso"
        },
        {
          "mine": false,
          "text": "obg salvas me"
        }
      ]
    },
    {
      "name": "Henrique",
      "messages": [
        {
          "mine": true,
          "text": "afinal compraste a bike?"
        },
        {
          "mine": false,
          "text": "sim chegou hoje"
        },
        {
          "mine": true,
          "text": "boaa qual"
        },
        {
          "mine": false,
          "text": "a q te mostrei"
        },
        {
          "mine": true,
          "text": "vamos pedalar entao"
        }
      ]
    },
    {
      "name": "Núria",
      "messages": [
        {
          "mine": false,
          "text": "esqueceste te de me responder ontem"
        },
        {
          "mine": true,
          "text": "ai desculpa adormeci"
        },
        {
          "mine": false,
          "text": "ahah tipico"
        },
        {
          "mine": true,
          "text": "entao amanha almoço?"
        },
        {
          "mine": false,
          "text": "combinado"
        }
      ]
    },
    {
      "name": "Xavi",
      "messages": [
        {
          "mine": false,
          "text": "afinal o q levo pro churrasco"
        },
        {
          "mine": true,
          "text": "carne ja ta tratada traz bebidas"
        },
        {
          "mine": false,
          "text": "quantas pessoas"
        },
        {
          "mine": true,
          "text": "umas 8"
        },
        {
          "mine": false,
          "text": "ok trato disso"
        }
      ]
    },
    {
      "name": "Susana",
      "messages": [
        {
          "mine": true,
          "text": "aquele restaurante fechou?"
        },
        {
          "mine": false,
          "text": "acho q sim"
        },
        {
          "mine": false,
          "text": "passei la e tava as escuras"
        },
        {
          "mine": true,
          "text": "q pena era bom"
        },
        {
          "mine": false,
          "text": "muito"
        }
      ]
    },
    {
      "name": "Paulo",
      "messages": [
        {
          "mine": false,
          "text": "meu deixaste as luzes do carro ligadas"
        },
        {
          "mine": true,
          "text": "o que serio"
        },
        {
          "mine": false,
          "text": "sim ta ali no parque"
        },
        {
          "mine": true,
          "text": "obg ja vou desligar"
        },
        {
          "mine": false,
          "text": "corre antes q descarrega"
        }
      ]
    },
    {
      "name": "Cris",
      "messages": [
        {
          "mine": false,
          "text": "tas a ver o q vou vestir amanha"
        },
        {
          "mine": true,
          "text": "manda opcoes"
        },
        {
          "mine": false,
          "text": "ja mando"
        },
        {
          "mine": true,
          "text": "o preto sempre"
        },
        {
          "mine": false,
          "text": "ahah dizes sempre o preto"
        }
      ]
    },
    {
      "name": "Dinis",
      "messages": [
        {
          "mine": true,
          "text": "afinal passaste a cadeira?"
        },
        {
          "mine": false,
          "text": "passeii"
        },
        {
          "mine": true,
          "text": "boaa parabens mano"
        },
        {
          "mine": false,
          "text": "por um triz mas passei"
        },
        {
          "mine": true,
          "text": "o q importa é passar"
        }
      ]
    },
    {
      "name": "Eva",
      "messages": [
        {
          "mine": false,
          "text": "vens ao meu aniversario sexta?"
        },
        {
          "mine": true,
          "text": "claro q vou"
        },
        {
          "mine": false,
          "text": "leva o joao tb"
        },
        {
          "mine": true,
          "text": "digo lhe"
        },
        {
          "mine": false,
          "text": "boaa vai ser fixe"
        }
      ]
    },
    {
      "name": "Rodrigo",
      "messages": [
        {
          "mine": false,
          "text": "tas a ver o transito na ponte"
        },
        {
          "mine": true,
          "text": "credo parado"
        },
        {
          "mine": false,
          "text": "1h ja aqui"
        },
        {
          "mine": true,
          "text": "paciencia mano"
        },
        {
          "mine": false,
          "text": "vou chegar super atrasado"
        }
      ]
    },
    {
      "name": "Patrícia",
      "messages": [
        {
          "mine": true,
          "text": "ficou tudo bem com a mudança?"
        },
        {
          "mine": false,
          "text": "sim ja ta quase"
        },
        {
          "mine": false,
          "text": "so falta arrumar a cozinha"
        },
        {
          "mine": true,
          "text": "amanha dou uma ajuda"
        },
        {
          "mine": false,
          "text": "obg mesmo"
        }
      ]
    },
    {
      "name": "Fred",
      "messages": [
        {
          "mine": false,
          "text": "meu o gajo do apartamento ligou"
        },
        {
          "mine": true,
          "text": "e disse o q"
        },
        {
          "mine": false,
          "text": "q podemos ver sabado"
        },
        {
          "mine": true,
          "text": "boa a q horas"
        },
        {
          "mine": false,
          "text": "confirmo depois"
        }
      ]
    },
    {
      "name": "Neca",
      "messages": [
        {
          "mine": true,
          "text": "tas com o meu livro ainda?"
        },
        {
          "mine": false,
          "text": "sim desculpa ja acabo"
        },
        {
          "mine": true,
          "text": "sem pressa"
        },
        {
          "mine": false,
          "text": "ta muito bom btw"
        },
        {
          "mine": true,
          "text": "eu disse te ahah"
        }
      ]
    },
    {
      "name": "Chico",
      "messages": [
        {
          "mine": false,
          "text": "afinal a que horas abre"
        },
        {
          "mine": true,
          "text": "acho q as 10"
        },
        {
          "mine": false,
          "text": "melhor irmos cedo"
        },
        {
          "mine": true,
          "text": "sim senao ta cheio"
        },
        {
          "mine": false,
          "text": "9:45 la fora entao"
        }
      ]
    },
    {
      "name": "Lena",
      "messages": [
        {
          "mine": false,
          "text": "sonhei contigo esta noite q estranho"
        },
        {
          "mine": true,
          "text": "ahah sonho bom espero"
        },
        {
          "mine": false,
          "text": "estavamos numa viagem esquisita"
        },
        {
          "mine": true,
          "text": "vamos fazer isso acontecer"
        },
        {
          "mine": false,
          "text": "combinado ahah"
        }
      ]
    },
    {
      "name": "Zé Pedro",
      "messages": [
        {
          "mine": true,
          "text": "meu ainda deves me da ultima vez"
        },
        {
          "mine": false,
          "text": "ai é verdade quanto era"
        },
        {
          "mine": true,
          "text": "15"
        },
        {
          "mine": false,
          "text": "ja transfiro desculpa"
        },
        {
          "mine": true,
          "text": "sem stress"
        }
      ]
    },
    {
      "name": "Bibi",
      "messages": [
        {
          "mine": false,
          "text": "ta a chover ai tb?"
        },
        {
          "mine": true,
          "text": "torrencial"
        },
        {
          "mine": false,
          "text": "e eu sem guarda chuva"
        },
        {
          "mine": true,
          "text": "corre pah ahah"
        },
        {
          "mine": false,
          "text": "encharcada ja"
        }
      ]
    },
    {
      "name": "Toni",
      "messages": [
        {
          "mine": false,
          "text": "vens a pesca no sabado"
        },
        {
          "mine": true,
          "text": "a q horas é a maluqueira"
        },
        {
          "mine": false,
          "text": "5 da manha"
        },
        {
          "mine": true,
          "text": "5 da manha? tas doido"
        },
        {
          "mine": false,
          "text": "é quando os peixes mordem"
        },
        {
          "mine": true,
          "text": "os peixes q se lixem quero dormir"
        }
      ]
    },
    {
      "name": "Marco trampo",
      "messages": [
        {
          "mine": false,
          "text": "a reuniao passou pras 3"
        },
        {
          "mine": true,
          "text": "ok obg por avisares"
        },
        {
          "mine": false,
          "text": "trazes o teu portatil"
        },
        {
          "mine": true,
          "text": "sim vou levar"
        },
        {
          "mine": false,
          "text": "boa até logo"
        }
      ]
    },
    {
      "name": "Sandro",
      "messages": [
        {
          "mine": true,
          "text": "afinal vemos o filme hoje ou n"
        },
        {
          "mine": false,
          "text": "to morto do trabalho"
        },
        {
          "mine": true,
          "text": "amanha entao"
        },
        {
          "mine": false,
          "text": "amanha sim prometo"
        },
        {
          "mine": true,
          "text": "ok descansa"
        }
      ]
    }
  ],
  "nl": [
    {
      "name": "Sanne",
      "messages": [
        {
          "mine": false,
          "text": "kom je nog vanavond?"
        },
        {
          "mine": true,
          "text": "jaa ik denk rond 8"
        },
        {
          "mine": false,
          "text": "oke top"
        },
        {
          "mine": true,
          "text": "moet ik nog iets meenemen?"
        },
        {
          "mine": false,
          "text": "nee joh gewoon jezelf haha"
        }
      ]
    },
    {
      "name": "Daan",
      "messages": [
        {
          "mine": true,
          "text": "ben je al wakker"
        },
        {
          "mine": false,
          "text": "nee"
        },
        {
          "mine": false,
          "text": "hoezo"
        },
        {
          "mine": true,
          "text": "we zouden toch gaan hardlopen ofniet"
        },
        {
          "mine": false,
          "text": "oh shit ff douchen kom eraan"
        }
      ]
    },
    {
      "name": "Lotte",
      "messages": [
        {
          "mine": false,
          "text": "heb je die serie al gekeken"
        },
        {
          "mine": true,
          "text": "welke"
        },
        {
          "mine": false,
          "text": "die nieuwe op netflix waar ik het over had"
        },
        {
          "mine": true,
          "text": "nee nog niet, is ie goed?"
        },
        {
          "mine": false,
          "text": "echt zo goed, aflevering 3 huilde ik"
        },
        {
          "mine": true,
          "text": "haha oke ga ik vanavond doen"
        }
      ]
    },
    {
      "name": "Bram",
      "messages": [
        {
          "mine": true,
          "text": "waar ben je"
        },
        {
          "mine": false,
          "text": "bij de ingang"
        },
        {
          "mine": true,
          "text": "welke ingang joh er zijn er 3"
        },
        {
          "mine": false,
          "text": "die bij de albert heijn"
        },
        {
          "mine": true,
          "text": "kom eraan"
        }
      ]
    },
    {
      "name": "Fleur",
      "messages": [
        {
          "mine": false,
          "text": "ik ben zo moe vandaag"
        },
        {
          "mine": true,
          "text": "laat nachtje gehad?"
        },
        {
          "mine": false,
          "text": "ja veel te laat blijven hangen bij noa"
        },
        {
          "mine": true,
          "text": "haha typisch"
        },
        {
          "mine": false,
          "text": "ik ga vanmiddag echt even slapen"
        }
      ]
    },
    {
      "name": "Sam",
      "messages": [
        {
          "mine": true,
          "text": "zin in koffie straks?"
        },
        {
          "mine": false,
          "text": "altijd"
        },
        {
          "mine": false,
          "text": "hoe laat"
        },
        {
          "mine": true,
          "text": "half 4 ofzo bij de gebruikelijke plek"
        },
        {
          "mine": false,
          "text": "top tot dan"
        }
      ]
    },
    {
      "name": "Tess",
      "messages": [
        {
          "mine": false,
          "text": "hebben jullie het uitgemaakt???"
        },
        {
          "mine": true,
          "text": "wie zegt dat"
        },
        {
          "mine": false,
          "text": "julia zei het"
        },
        {
          "mine": true,
          "text": "julia moet haar mond houden lol"
        },
        {
          "mine": true,
          "text": "we hebben gewoon even ruzie"
        },
        {
          "mine": false,
          "text": "oh oke sorry"
        }
      ]
    },
    {
      "name": "Jelle",
      "messages": [
        {
          "mine": true,
          "text": "kom je zaterdag voetballen"
        },
        {
          "mine": false,
          "text": "kan niet man werk"
        },
        {
          "mine": true,
          "text": "weer?"
        },
        {
          "mine": false,
          "text": "ja ik weet het klote"
        },
        {
          "mine": true,
          "text": "volgende week dan"
        }
      ]
    },
    {
      "name": "Fem",
      "messages": [
        {
          "mine": false,
          "text": "wat doe je"
        },
        {
          "mine": true,
          "text": "niks jij"
        },
        {
          "mine": false,
          "text": "verveel me kapot"
        },
        {
          "mine": true,
          "text": "kom langs dan"
        },
        {
          "mine": false,
          "text": "ben er over 20 min"
        }
      ]
    },
    {
      "name": "Anna studie",
      "messages": [
        {
          "mine": false,
          "text": "heb jij de aantekeningen van maandag"
        },
        {
          "mine": true,
          "text": "ja wil je ze hebben?"
        },
        {
          "mine": false,
          "text": "ja graag ik was er niet"
        },
        {
          "mine": true,
          "text": "stuur ik zo even"
        },
        {
          "mine": false,
          "text": "je bent een held"
        }
      ]
    },
    {
      "name": "Jorick huis",
      "messages": [
        {
          "mine": true,
          "text": "wc papier is op"
        },
        {
          "mine": false,
          "text": "alweer? ik heb net gehaald"
        },
        {
          "mine": true,
          "text": "nou het is echt op"
        },
        {
          "mine": false,
          "text": "oke ik pak wel wat mee vanavond"
        }
      ]
    },
    {
      "name": "Max werk",
      "messages": [
        {
          "mine": false,
          "text": "kom je nog naar de borrel vrijdag"
        },
        {
          "mine": true,
          "text": "denk het wel, jij?"
        },
        {
          "mine": false,
          "text": "ja ga ik heen"
        },
        {
          "mine": true,
          "text": "top gezellig"
        }
      ]
    },
    {
      "name": "Sara sport",
      "messages": [
        {
          "mine": true,
          "text": "ga je morgen naar de les"
        },
        {
          "mine": false,
          "text": "ja die van 9 uur"
        },
        {
          "mine": true,
          "text": "oke zie ik je daar"
        },
        {
          "mine": false,
          "text": "ja tot dan, niet weer verslapen haha"
        },
        {
          "mine": true,
          "text": "1 keer joh"
        }
      ]
    },
    {
      "name": "Lisa ❤️",
      "messages": [
        {
          "mine": false,
          "text": "mis je"
        },
        {
          "mine": true,
          "text": "mis jou meer"
        },
        {
          "mine": false,
          "text": "hoe laat ben je thuis"
        },
        {
          "mine": true,
          "text": "rond 6 denk ik, zal ik eten halen?"
        },
        {
          "mine": false,
          "text": "jaaa graag die van gisteren was lekker"
        },
        {
          "mine": true,
          "text": "oke doe ik"
        }
      ]
    },
    {
      "name": "Mama",
      "messages": [
        {
          "mine": false,
          "text": "kom je zondag eten?"
        },
        {
          "mine": true,
          "text": "ja hoe laat"
        },
        {
          "mine": false,
          "text": "half 6, papa maakt zijn stoofpot"
        },
        {
          "mine": true,
          "text": "lekker tot zondag"
        },
        {
          "mine": false,
          "text": "zal ik ook iets voor je wassen meenemen"
        },
        {
          "mine": true,
          "text": "haha nee mam gaat goed"
        }
      ]
    },
    {
      "name": "Papa",
      "messages": [
        {
          "mine": true,
          "text": "pap kun je me morgen naar het station brengen"
        },
        {
          "mine": false,
          "text": "hoe laat"
        },
        {
          "mine": true,
          "text": "trein gaat om 8:12"
        },
        {
          "mine": false,
          "text": "oke dan gaan we om kwart voor"
        },
        {
          "mine": true,
          "text": "top thanks"
        }
      ]
    },
    {
      "name": "Oma",
      "messages": [
        {
          "mine": false,
          "text": "dag lieverd hoe gaat het met je"
        },
        {
          "mine": true,
          "text": "goed hoor oma! en met u?"
        },
        {
          "mine": false,
          "text": "ook goed, kom je nog eens langs?"
        },
        {
          "mine": true,
          "text": "ja zeker, volgende week woensdag?"
        },
        {
          "mine": false,
          "text": "gezellig ik bak een taart"
        }
      ]
    },
    {
      "name": "Opa",
      "messages": [
        {
          "mine": true,
          "text": "opa gefeliciteerd met je verjaardag!"
        },
        {
          "mine": false,
          "text": "dankjewel jongen"
        },
        {
          "mine": false,
          "text": "kom je taart eten zondag"
        },
        {
          "mine": true,
          "text": "ja natuurlijk tot zondag"
        }
      ]
    },
    {
      "name": "huis",
      "messages": [
        {
          "mine": false,
          "text": "wie heeft de afwas laten staan"
        },
        {
          "mine": true,
          "text": "niet ik"
        },
        {
          "mine": false,
          "text": "ook niet ik"
        },
        {
          "mine": true,
          "text": "dan was het jorick weer"
        },
        {
          "mine": false,
          "text": "jongens ik ben gewoon vergeten sorry doe het zo"
        }
      ]
    },
    {
      "name": "familie",
      "messages": [
        {
          "mine": false,
          "text": "iedereen zondag om 5?"
        },
        {
          "mine": true,
          "text": "wij zijn er"
        },
        {
          "mine": false,
          "text": "wij ook"
        },
        {
          "mine": false,
          "text": "ik neem toetje mee"
        },
        {
          "mine": true,
          "text": "top ik zorg voor drinken"
        }
      ]
    },
    {
      "name": "de meiden",
      "messages": [
        {
          "mine": false,
          "text": "wie is er dit weekend vrij"
        },
        {
          "mine": true,
          "text": "ik!"
        },
        {
          "mine": false,
          "text": "ik kan zaterdag"
        },
        {
          "mine": false,
          "text": "zullen we wat drinken in de stad"
        },
        {
          "mine": true,
          "text": "jaaa gezellig"
        },
        {
          "mine": false,
          "text": "8 uur bij de gracht?"
        }
      ]
    },
    {
      "name": "voetbal",
      "messages": [
        {
          "mine": false,
          "text": "training gaat door vanavond"
        },
        {
          "mine": true,
          "text": "in deze regen??"
        },
        {
          "mine": false,
          "text": "ja gewoon doorgaan mietje haha"
        },
        {
          "mine": true,
          "text": "oke oke tot 7"
        }
      ]
    },
    {
      "name": "vriendengroep",
      "messages": [
        {
          "mine": false,
          "text": "wie doet er mee met bowlen zaterdag"
        },
        {
          "mine": true,
          "text": "ik ben er"
        },
        {
          "mine": false,
          "text": "ik ook"
        },
        {
          "mine": false,
          "text": "ik moet werken helaas"
        },
        {
          "mine": true,
          "text": "jammer joh volgende keer"
        }
      ]
    },
    {
      "name": "Thijs",
      "messages": [
        {
          "mine": true,
          "text": "heb je mijn oplader nog"
        },
        {
          "mine": false,
          "text": "ja sorry vergeten terug te geven"
        },
        {
          "mine": true,
          "text": "geeft niks neem je hem morgen mee"
        },
        {
          "mine": false,
          "text": "ja staat al in mijn tas"
        }
      ]
    },
    {
      "name": "Noa",
      "messages": [
        {
          "mine": false,
          "text": "raad eens wie ik net tegenkwam"
        },
        {
          "mine": true,
          "text": "wie"
        },
        {
          "mine": false,
          "text": "die jongen van de middelbare, weet je nog"
        },
        {
          "mine": true,
          "text": "welke joh er waren er honderd"
        },
        {
          "mine": false,
          "text": "die met dat haar haha"
        },
        {
          "mine": true,
          "text": "helpt me niet echt"
        }
      ]
    },
    {
      "name": "Julia",
      "messages": [
        {
          "mine": true,
          "text": "gaat het wel met je"
        },
        {
          "mine": false,
          "text": "ja hoezo"
        },
        {
          "mine": true,
          "text": "je was zo stil vanmiddag"
        },
        {
          "mine": false,
          "text": "gewoon moe hoor niks aan de hand"
        },
        {
          "mine": true,
          "text": "oke, je weet me te vinden"
        },
        {
          "mine": false,
          "text": "weet ik, thanks"
        }
      ]
    },
    {
      "name": "Milan",
      "messages": [
        {
          "mine": false,
          "text": "man wat een dag"
        },
        {
          "mine": true,
          "text": "wat is er"
        },
        {
          "mine": false,
          "text": "alles ging mis op werk gewoon alles"
        },
        {
          "mine": true,
          "text": "kom een biertje doen dan"
        },
        {
          "mine": false,
          "text": "ja goed idee"
        }
      ]
    },
    {
      "name": "Sven",
      "messages": [
        {
          "mine": true,
          "text": "kom je fifa doen straks"
        },
        {
          "mine": false,
          "text": "ja over een uurtje"
        },
        {
          "mine": true,
          "text": "oke ik zet alvast klaar"
        },
        {
          "mine": false,
          "text": "je gaat toch verliezen haha"
        }
      ]
    },
    {
      "name": "Roos",
      "messages": [
        {
          "mine": false,
          "text": "heb jij toevallig een paraplu over"
        },
        {
          "mine": true,
          "text": "ja waarom"
        },
        {
          "mine": false,
          "text": "het giet en ik moet zo weg"
        },
        {
          "mine": true,
          "text": "kom maar halen ligt bij de deur"
        },
        {
          "mine": false,
          "text": "je bent geweldig"
        }
      ]
    },
    {
      "name": "Bas",
      "messages": [
        {
          "mine": true,
          "text": "waar zijn we ook alweer afgesproken"
        },
        {
          "mine": false,
          "text": "bij mij thuis joh"
        },
        {
          "mine": true,
          "text": "oh ja haha kom eraan"
        }
      ]
    },
    {
      "name": "Eva",
      "messages": [
        {
          "mine": false,
          "text": "heb je het gehoord van sanne"
        },
        {
          "mine": true,
          "text": "nee wat"
        },
        {
          "mine": false,
          "text": "ze heeft een nieuwe baan!"
        },
        {
          "mine": true,
          "text": "echt? wat leuk voor haar"
        },
        {
          "mine": false,
          "text": "ja ze is super blij"
        }
      ]
    },
    {
      "name": "Tim",
      "messages": [
        {
          "mine": true,
          "text": "kom je nog langs vanavond of niet"
        },
        {
          "mine": false,
          "text": "weet nog niet, ligt eraan hoe laat ik klaar ben"
        },
        {
          "mine": true,
          "text": "oke laat maar weten"
        },
        {
          "mine": false,
          "text": "doe ik"
        }
      ]
    },
    {
      "name": "Lars",
      "messages": [
        {
          "mine": false,
          "text": "heb je zin om morgen te klimmen"
        },
        {
          "mine": true,
          "text": "ja waar"
        },
        {
          "mine": false,
          "text": "die hal in de stad"
        },
        {
          "mine": true,
          "text": "hoe laat"
        },
        {
          "mine": false,
          "text": "een uur of 2?"
        },
        {
          "mine": true,
          "text": "top ben er"
        }
      ]
    },
    {
      "name": "Nina",
      "messages": [
        {
          "mine": true,
          "text": "ik heb honger"
        },
        {
          "mine": false,
          "text": "eet dan iets"
        },
        {
          "mine": true,
          "text": "er is niks in huis"
        },
        {
          "mine": false,
          "text": "haal wat dan luiaard haha"
        },
        {
          "mine": true,
          "text": "te moe om naar de winkel te lopen"
        }
      ]
    },
    {
      "name": "Ruben",
      "messages": [
        {
          "mine": false,
          "text": "kom je me helpen verhuizen zaterdag"
        },
        {
          "mine": true,
          "text": "oef hoe laat"
        },
        {
          "mine": false,
          "text": "9 uur, er is pizza achteraf"
        },
        {
          "mine": true,
          "text": "voor pizza doe ik alles, ben er"
        },
        {
          "mine": false,
          "text": "haha top"
        }
      ]
    },
    {
      "name": "Femke",
      "messages": [
        {
          "mine": true,
          "text": "hoe was je date gister"
        },
        {
          "mine": false,
          "text": "meh"
        },
        {
          "mine": true,
          "text": "oh nee wat gebeurde er"
        },
        {
          "mine": false,
          "text": "gewoon geen klik, hij praatte alleen over zichzelf"
        },
        {
          "mine": true,
          "text": "gadver, volgende"
        }
      ]
    },
    {
      "name": "Joris",
      "messages": [
        {
          "mine": false,
          "text": "kun je me morgen ophalen"
        },
        {
          "mine": true,
          "text": "kan maar hoe laat"
        },
        {
          "mine": false,
          "text": "rond 6 van het station"
        },
        {
          "mine": true,
          "text": "oke ik ben er"
        }
      ]
    },
    {
      "name": "Sofie",
      "messages": [
        {
          "mine": true,
          "text": "wat trek jij aan vanavond"
        },
        {
          "mine": false,
          "text": "geen idee, jij?"
        },
        {
          "mine": true,
          "text": "ook geen idee, daarom vraag ik het haha"
        },
        {
          "mine": false,
          "text": "gewoon jeans en een leuk topje ofzo"
        },
        {
          "mine": true,
          "text": "oke doe ik ook"
        }
      ]
    },
    {
      "name": "Guus",
      "messages": [
        {
          "mine": false,
          "text": "heb je die wedstrijd gezien gister"
        },
        {
          "mine": true,
          "text": "ja man wat een goal"
        },
        {
          "mine": false,
          "text": "echt niet normaal"
        },
        {
          "mine": true,
          "text": "we hebben verdiend gewonnen"
        }
      ]
    },
    {
      "name": "Isa",
      "messages": [
        {
          "mine": true,
          "text": "ben je boos op me"
        },
        {
          "mine": false,
          "text": "nee joh hoezo"
        },
        {
          "mine": true,
          "text": "je reageerde zo kort net"
        },
        {
          "mine": false,
          "text": "sorry zat gewoon in de trein slecht bereik"
        },
        {
          "mine": true,
          "text": "oh oke haha sorry dan"
        }
      ]
    },
    {
      "name": "Pim",
      "messages": [
        {
          "mine": false,
          "text": "kom je koffie halen"
        },
        {
          "mine": true,
          "text": "ja voor mij ook een"
        },
        {
          "mine": false,
          "text": "welke"
        },
        {
          "mine": true,
          "text": "cappuccino thanks"
        },
        {
          "mine": false,
          "text": "komt eraan"
        }
      ]
    },
    {
      "name": "Marit",
      "messages": [
        {
          "mine": true,
          "text": "zullen we dit weekend naar de markt"
        },
        {
          "mine": false,
          "text": "ja leuk zaterdag?"
        },
        {
          "mine": true,
          "text": "ja ochtend, dan is het minder druk"
        },
        {
          "mine": false,
          "text": "top ik haal je op om 10"
        }
      ]
    },
    {
      "name": "Stijn",
      "messages": [
        {
          "mine": false,
          "text": "heb je nog geld van me tegoed?"
        },
        {
          "mine": true,
          "text": "ja die 15 van de film nog"
        },
        {
          "mine": false,
          "text": "oh ja sorry stuur ik nu"
        },
        {
          "mine": true,
          "text": "geen haast joh"
        }
      ]
    },
    {
      "name": "Iris",
      "messages": [
        {
          "mine": true,
          "text": "ik verveel me op werk"
        },
        {
          "mine": false,
          "text": "same"
        },
        {
          "mine": true,
          "text": "nog 3 uur te gaan"
        },
        {
          "mine": false,
          "text": "ik heb er 5 tel je zegeningen"
        },
        {
          "mine": true,
          "text": "haha oef sterkte"
        }
      ]
    },
    {
      "name": "Wout",
      "messages": [
        {
          "mine": false,
          "text": "ga je mee naar het festival"
        },
        {
          "mine": true,
          "text": "wanneer is het ook alweer"
        },
        {
          "mine": false,
          "text": "over 2 weken zaterdag"
        },
        {
          "mine": true,
          "text": "ja ik ga mee, kaartjes al geregeld?"
        },
        {
          "mine": false,
          "text": "nog niet, doe ik vanavond"
        }
      ]
    },
    {
      "name": "Britt",
      "messages": [
        {
          "mine": true,
          "text": "hoe laat begint het feestje zaterdag"
        },
        {
          "mine": false,
          "text": "vanaf 9 maar kom gerust later"
        },
        {
          "mine": true,
          "text": "oke wat moet ik meenemen"
        },
        {
          "mine": false,
          "text": "gewoon je eigen drinken"
        },
        {
          "mine": true,
          "text": "top tot dan"
        }
      ]
    },
    {
      "name": "Koen",
      "messages": [
        {
          "mine": false,
          "text": "je hebt je jas laten liggen"
        },
        {
          "mine": true,
          "text": "oh shit waar"
        },
        {
          "mine": false,
          "text": "hangt nog bij mij"
        },
        {
          "mine": true,
          "text": "haal ik morgen wel, thanks"
        }
      ]
    },
    {
      "name": "Amber",
      "messages": [
        {
          "mine": true,
          "text": "gaan we nog sporten deze week"
        },
        {
          "mine": false,
          "text": "ja donderdag?"
        },
        {
          "mine": true,
          "text": "kan niet donderdag, woensdag?"
        },
        {
          "mine": false,
          "text": "oke woensdag na werk"
        },
        {
          "mine": true,
          "text": "top"
        }
      ]
    },
    {
      "name": "Floris",
      "messages": [
        {
          "mine": false,
          "text": "man ik ben ziek"
        },
        {
          "mine": true,
          "text": "oh nee wat heb je"
        },
        {
          "mine": false,
          "text": "gewoon verkouden maar voel me brak"
        },
        {
          "mine": true,
          "text": "beterschap joh, veel thee"
        },
        {
          "mine": false,
          "text": "thanks"
        }
      ]
    },
    {
      "name": "Lieke",
      "messages": [
        {
          "mine": true,
          "text": "kom je vanavond mee eten"
        },
        {
          "mine": false,
          "text": "waar"
        },
        {
          "mine": true,
          "text": "bij die nieuwe italiaan"
        },
        {
          "mine": false,
          "text": "ja lekker hoe laat"
        },
        {
          "mine": true,
          "text": "7 uur, ik reserveer"
        },
        {
          "mine": false,
          "text": "top"
        }
      ]
    },
    {
      "name": "schat",
      "messages": [
        {
          "mine": false,
          "text": "ben onderweg naar huis"
        },
        {
          "mine": true,
          "text": "oke ik kook al"
        },
        {
          "mine": false,
          "text": "wat maak je"
        },
        {
          "mine": true,
          "text": "verrassing"
        },
        {
          "mine": false,
          "text": "spannend haha tot zo"
        }
      ]
    },
    {
      "name": "liefje",
      "messages": [
        {
          "mine": true,
          "text": "slaap je al?"
        },
        {
          "mine": false,
          "text": "bijna, jij?"
        },
        {
          "mine": true,
          "text": "lig in bed maar kan niet slapen"
        },
        {
          "mine": false,
          "text": "denk maar aan mij dan slaap je zo"
        },
        {
          "mine": true,
          "text": "cheesy haha maar lief, welterusten"
        },
        {
          "mine": false,
          "text": "welterusten x"
        }
      ]
    },
    {
      "name": "Mees",
      "messages": [
        {
          "mine": false,
          "text": "kom je gamen vanavond"
        },
        {
          "mine": true,
          "text": "ja hoe laat"
        },
        {
          "mine": false,
          "text": "8 ofzo"
        },
        {
          "mine": true,
          "text": "oke ben er"
        }
      ]
    },
    {
      "name": "Yara",
      "messages": [
        {
          "mine": true,
          "text": "heb je die foto's al gestuurd van het weekend"
        },
        {
          "mine": false,
          "text": "oh nee vergeten, doe ik nu"
        },
        {
          "mine": true,
          "text": "graag ze waren zo leuk"
        },
        {
          "mine": false,
          "text": "check je app"
        }
      ]
    },
    {
      "name": "Teun",
      "messages": [
        {
          "mine": false,
          "text": "waar blijf je man we wachten"
        },
        {
          "mine": true,
          "text": "sorry sta in de file"
        },
        {
          "mine": false,
          "text": "hoe lang nog"
        },
        {
          "mine": true,
          "text": "20 min ofzo, begin maar vast"
        }
      ]
    },
    {
      "name": "Nikki",
      "messages": [
        {
          "mine": true,
          "text": "heb je zin om te bakken zondag"
        },
        {
          "mine": false,
          "text": "ja wat gaan we maken"
        },
        {
          "mine": true,
          "text": "die brownies weer?"
        },
        {
          "mine": false,
          "text": "jaaa die waren zo goed"
        },
        {
          "mine": true,
          "text": "oke ik haal de spullen"
        }
      ]
    },
    {
      "name": "Jasper",
      "messages": [
        {
          "mine": false,
          "text": "kom je nog naar mijn optreden zaterdag"
        },
        {
          "mine": true,
          "text": "ja natuurlijk hoe laat begin je"
        },
        {
          "mine": false,
          "text": "rond 9, kom wat eerder dan drinken we wat"
        },
        {
          "mine": true,
          "text": "top tot dan, succes alvast"
        }
      ]
    },
    {
      "name": "Renske",
      "messages": [
        {
          "mine": true,
          "text": "wat een weer he"
        },
        {
          "mine": false,
          "text": "echt niet te doen zo warm"
        },
        {
          "mine": true,
          "text": "ik smelt"
        },
        {
          "mine": false,
          "text": "kom naar het zwembad dan"
        },
        {
          "mine": true,
          "text": "goed plan geef me een uur"
        }
      ]
    },
    {
      "name": "Bart",
      "messages": [
        {
          "mine": false,
          "text": "heb jij mijn boek nog"
        },
        {
          "mine": true,
          "text": "welk boek"
        },
        {
          "mine": false,
          "text": "die ik je maanden geleden gaf"
        },
        {
          "mine": true,
          "text": "oh die ja, ligt ergens hier haha zoek ik op"
        },
        {
          "mine": false,
          "text": "geen haast"
        }
      ]
    },
    {
      "name": "Sanne B",
      "messages": [
        {
          "mine": true,
          "text": "gefeliciteerd met je nieuwe huis!!"
        },
        {
          "mine": false,
          "text": "dankjeee ik ben zo blij"
        },
        {
          "mine": true,
          "text": "wanneer is de housewarming"
        },
        {
          "mine": false,
          "text": "volgende maand, je krijgt nog een uitnodiging"
        },
        {
          "mine": true,
          "text": "kan niet wachten"
        }
      ]
    },
    {
      "name": "Dennis werk",
      "messages": [
        {
          "mine": false,
          "text": "kun je die mail nog even checken die ik stuurde"
        },
        {
          "mine": true,
          "text": "ja doe ik zo even"
        },
        {
          "mine": false,
          "text": "top voor het einde van de dag graag"
        },
        {
          "mine": true,
          "text": "komt goed"
        }
      ]
    },
    {
      "name": "Kim",
      "messages": [
        {
          "mine": true,
          "text": "zullen we samen naar het feest"
        },
        {
          "mine": false,
          "text": "ja leuk, zal ik jou ophalen"
        },
        {
          "mine": true,
          "text": "ja graag rond 8?"
        },
        {
          "mine": false,
          "text": "top tot dan"
        }
      ]
    },
    {
      "name": "Rick",
      "messages": [
        {
          "mine": false,
          "text": "man die film gister was echt slecht"
        },
        {
          "mine": true,
          "text": "haha ja verspilde avond"
        },
        {
          "mine": false,
          "text": "volgende keer kies ik"
        },
        {
          "mine": true,
          "text": "kan niet slechter dan jij haha"
        }
      ]
    },
    {
      "name": "Maud",
      "messages": [
        {
          "mine": true,
          "text": "hoe ging je tentamen"
        },
        {
          "mine": false,
          "text": "geen idee eerlijk gezegd"
        },
        {
          "mine": true,
          "text": "komt vast goed joh"
        },
        {
          "mine": false,
          "text": "hoop het, was echt zwaar"
        },
        {
          "mine": true,
          "text": "je hebt hard geleerd, vertrouw erop"
        }
      ]
    },
    {
      "name": "Niels",
      "messages": [
        {
          "mine": false,
          "text": "biertje vanavond?"
        },
        {
          "mine": true,
          "text": "kan niet vanavond, morgen?"
        },
        {
          "mine": false,
          "text": "oke morgen dan zelfde tijd"
        },
        {
          "mine": true,
          "text": "top"
        }
      ]
    },
    {
      "name": "Puck",
      "messages": [
        {
          "mine": true,
          "text": "waar ben je gebleven gister"
        },
        {
          "mine": false,
          "text": "ben vroeg weg gegaan, was moe"
        },
        {
          "mine": true,
          "text": "oh had niks gezegd"
        },
        {
          "mine": false,
          "text": "sorry wilde je niet storen, was gezellig hoor"
        }
      ]
    },
    {
      "name": "Vince",
      "messages": [
        {
          "mine": false,
          "text": "kom je helpen met de bbq zaterdag"
        },
        {
          "mine": true,
          "text": "ja wat moet ik meenemen"
        },
        {
          "mine": false,
          "text": "gewoon jezelf en misschien wat vlees"
        },
        {
          "mine": true,
          "text": "oke ik regel wat"
        }
      ]
    },
    {
      "name": "Loes",
      "messages": [
        {
          "mine": true,
          "text": "heb je even? ik moet iets kwijt"
        },
        {
          "mine": false,
          "text": "ja tuurlijk wat is er"
        },
        {
          "mine": true,
          "text": "gewoon een rot dag, mag ik bellen?"
        },
        {
          "mine": false,
          "text": "ja bel maar ik neem op"
        }
      ]
    },
    {
      "name": "Gijs",
      "messages": [
        {
          "mine": false,
          "text": "kom je nog squashen deze week"
        },
        {
          "mine": true,
          "text": "ja wanneer kan jij"
        },
        {
          "mine": false,
          "text": "donderdag avond?"
        },
        {
          "mine": true,
          "text": "top boek jij de baan"
        },
        {
          "mine": false,
          "text": "doe ik"
        }
      ]
    },
    {
      "name": "Esmee",
      "messages": [
        {
          "mine": true,
          "text": "ik heb de leukste jurk gevonden"
        },
        {
          "mine": false,
          "text": "laat zien!"
        },
        {
          "mine": true,
          "text": "stuur zo een foto"
        },
        {
          "mine": false,
          "text": "ik wil hem vast ook haha"
        }
      ]
    },
    {
      "name": "Robin",
      "messages": [
        {
          "mine": false,
          "text": "waar spreken we af morgen"
        },
        {
          "mine": true,
          "text": "bij het station lijkt me makkelijk"
        },
        {
          "mine": false,
          "text": "oke hoe laat"
        },
        {
          "mine": true,
          "text": "10 uur?"
        },
        {
          "mine": false,
          "text": "top"
        }
      ]
    },
    {
      "name": "Merel",
      "messages": [
        {
          "mine": true,
          "text": "kom je nog langs deze week"
        },
        {
          "mine": false,
          "text": "ja wil graag, wanneer komt uit"
        },
        {
          "mine": true,
          "text": "woensdag of donderdag"
        },
        {
          "mine": false,
          "text": "donderdag dan, breng ik wijn mee"
        },
        {
          "mine": true,
          "text": "gezellig"
        }
      ]
    },
    {
      "name": "Cas",
      "messages": [
        {
          "mine": false,
          "text": "man ik heb mijn sleutels verloren"
        },
        {
          "mine": true,
          "text": "weer??"
        },
        {
          "mine": false,
          "text": "ja echt de laatste keer was toch een maand geleden"
        },
        {
          "mine": true,
          "text": "haha je bent hopeloos, heb je reserve"
        },
        {
          "mine": false,
          "text": "gelukkig wel"
        }
      ]
    },
    {
      "name": "Fenna",
      "messages": [
        {
          "mine": true,
          "text": "hoe laat gaan we morgen"
        },
        {
          "mine": false,
          "text": "vroeg, ik wil er om 9 zijn"
        },
        {
          "mine": true,
          "text": "oef oke, dan haal ik je om half 9"
        },
        {
          "mine": false,
          "text": "top ik zorg voor koffie onderweg"
        }
      ]
    },
    {
      "name": "Jesse",
      "messages": [
        {
          "mine": false,
          "text": "zin in een wandeling straks"
        },
        {
          "mine": true,
          "text": "ja waar naartoe"
        },
        {
          "mine": false,
          "text": "gewoon het bos in"
        },
        {
          "mine": true,
          "text": "oke geef me een half uur"
        },
        {
          "mine": false,
          "text": "prima ik wacht"
        }
      ]
    },
    {
      "name": "Demi",
      "messages": [
        {
          "mine": true,
          "text": "je raadt nooit wat er gebeurde"
        },
        {
          "mine": false,
          "text": "vertel"
        },
        {
          "mine": true,
          "text": "ik ben aangenomen voor die baan!!"
        },
        {
          "mine": false,
          "text": "wat?? gefeliciteerd!! zo goed"
        },
        {
          "mine": true,
          "text": "ik kan het nog niet geloven"
        },
        {
          "mine": false,
          "text": "verdiend joh echt"
        }
      ]
    },
    {
      "name": "Luuk",
      "messages": [
        {
          "mine": false,
          "text": "kom je nog naar de training"
        },
        {
          "mine": true,
          "text": "nee geblesseerd"
        },
        {
          "mine": false,
          "text": "oh nee wat heb je"
        },
        {
          "mine": true,
          "text": "mijn enkel, niks ergs hopelijk"
        },
        {
          "mine": false,
          "text": "rustig aan doen dan"
        }
      ]
    },
    {
      "name": "Naomi",
      "messages": [
        {
          "mine": true,
          "text": "wat doe jij dit weekend"
        },
        {
          "mine": false,
          "text": "niks eigenlijk, jij?"
        },
        {
          "mine": true,
          "text": "ook niks, zullen we wat doen"
        },
        {
          "mine": false,
          "text": "ja leuk, verzin jij iets"
        },
        {
          "mine": true,
          "text": "haha oke ik denk na"
        }
      ]
    },
    {
      "name": "Tobias",
      "messages": [
        {
          "mine": false,
          "text": "heb je die playlist nog gemaakt"
        },
        {
          "mine": true,
          "text": "ja bijna klaar"
        },
        {
          "mine": false,
          "text": "top stuur je hem straks"
        },
        {
          "mine": true,
          "text": "ja zodra ik thuis ben"
        }
      ]
    },
    {
      "name": "Saar",
      "messages": [
        {
          "mine": true,
          "text": "kom je koffie doen morgen"
        },
        {
          "mine": false,
          "text": "ja graag, waar"
        },
        {
          "mine": true,
          "text": "bij mij thuis is prima"
        },
        {
          "mine": false,
          "text": "oke tot morgen dan"
        }
      ]
    },
    {
      "name": "de mannen",
      "messages": [
        {
          "mine": false,
          "text": "wie doet er mee met poker vrijdag"
        },
        {
          "mine": true,
          "text": "ik ben er"
        },
        {
          "mine": false,
          "text": "ik ook"
        },
        {
          "mine": false,
          "text": "ik neem chips mee"
        },
        {
          "mine": true,
          "text": "en ik het bier"
        }
      ]
    },
    {
      "name": "weekendje weg",
      "messages": [
        {
          "mine": false,
          "text": "hebben we het huisje al geboekt"
        },
        {
          "mine": true,
          "text": "ja staat, betaald ook"
        },
        {
          "mine": false,
          "text": "top wie rijdt er"
        },
        {
          "mine": true,
          "text": "ik kan rijden, 4 man erbij"
        },
        {
          "mine": false,
          "text": "ik zit vol dan haha"
        }
      ]
    },
    {
      "name": "Opa Wim",
      "messages": [
        {
          "mine": true,
          "text": "opa hoe is het met de tuin"
        },
        {
          "mine": false,
          "text": "de tomaten komen goed op jongen"
        },
        {
          "mine": true,
          "text": "mooi, kom ik binnenkort proeven"
        },
        {
          "mine": false,
          "text": "graag, neem je moeder mee"
        }
      ]
    },
    {
      "name": "Oma Riet",
      "messages": [
        {
          "mine": false,
          "text": "dag schat, eet je zondag mee"
        },
        {
          "mine": true,
          "text": "ja graag oma, wat maakt u"
        },
        {
          "mine": false,
          "text": "je lievelings, andijviestamppot"
        },
        {
          "mine": true,
          "text": "jammiee tot zondag"
        }
      ]
    },
    {
      "name": "Chris gym",
      "messages": [
        {
          "mine": true,
          "text": "ga je vanavond nog trainen"
        },
        {
          "mine": false,
          "text": "ja rond 7, jij?"
        },
        {
          "mine": true,
          "text": "ja zelfde tijd, samen benen doen?"
        },
        {
          "mine": false,
          "text": "oef oke ik haat je alvast haha"
        }
      ]
    },
    {
      "name": "Anouk",
      "messages": [
        {
          "mine": false,
          "text": "kom je nog naar mijn verjaardag"
        },
        {
          "mine": true,
          "text": "ja wanneer ook alweer"
        },
        {
          "mine": false,
          "text": "zaterdag vanaf 3"
        },
        {
          "mine": true,
          "text": "top ik ben er, cadeau idee?"
        },
        {
          "mine": false,
          "text": "gewoon jij is genoeg haha"
        }
      ]
    },
    {
      "name": "Willem",
      "messages": [
        {
          "mine": true,
          "text": "heb je die klus al af"
        },
        {
          "mine": false,
          "text": "bijna, morgen klaar"
        },
        {
          "mine": true,
          "text": "top geen haast"
        },
        {
          "mine": false,
          "text": "komt goed"
        }
      ]
    },
    {
      "name": "Evi",
      "messages": [
        {
          "mine": false,
          "text": "ik mis je zo"
        },
        {
          "mine": true,
          "text": "ik jou ook, wanneer zie ik je weer"
        },
        {
          "mine": false,
          "text": "volgend weekend kom ik langs"
        },
        {
          "mine": true,
          "text": "yes kan niet wachten"
        }
      ]
    },
    {
      "name": "Sil",
      "messages": [
        {
          "mine": true,
          "text": "kom je mee lunchen"
        },
        {
          "mine": false,
          "text": "ja waar"
        },
        {
          "mine": true,
          "text": "die tent om de hoek"
        },
        {
          "mine": false,
          "text": "oke ben er over 10 min"
        }
      ]
    },
    {
      "name": "Jill",
      "messages": [
        {
          "mine": false,
          "text": "heb je nog nagedacht over de vakantie"
        },
        {
          "mine": true,
          "text": "ja ik denk toch italie"
        },
        {
          "mine": false,
          "text": "oh leuk waar precies"
        },
        {
          "mine": true,
          "text": "ergens aan de kust, moet nog kijken"
        },
        {
          "mine": false,
          "text": "klinkt goed, ik wil mee haha"
        }
      ]
    },
    {
      "name": "Mart",
      "messages": [
        {
          "mine": true,
          "text": "kom je zo nog even langs"
        },
        {
          "mine": false,
          "text": "waarvoor"
        },
        {
          "mine": true,
          "text": "gewoon gezellig, en je gereedschap terug"
        },
        {
          "mine": false,
          "text": "haha oke geef me een uur"
        }
      ]
    },
    {
      "name": "Benthe",
      "messages": [
        {
          "mine": false,
          "text": "wat een dag zeg"
        },
        {
          "mine": true,
          "text": "goed of slecht"
        },
        {
          "mine": false,
          "text": "slecht, alles ging fout"
        },
        {
          "mine": true,
          "text": "kom bij mij thee doen"
        },
        {
          "mine": false,
          "text": "ja graag ben er zo"
        }
      ]
    },
    {
      "name": "Ravi uni",
      "messages": [
        {
          "mine": true,
          "text": "heb jij de deadline van het verslag"
        },
        {
          "mine": false,
          "text": "vrijdag geloof ik"
        },
        {
          "mine": true,
          "text": "oef dat is snel"
        },
        {
          "mine": false,
          "text": "ja we moeten opschieten, samen werken morgen?"
        },
        {
          "mine": true,
          "text": "ja goed idee, bieb?"
        },
        {
          "mine": false,
          "text": "bieb, 10 uur"
        }
      ]
    },
    {
      "name": "Karlijn",
      "messages": [
        {
          "mine": false,
          "text": "zin in film avond"
        },
        {
          "mine": true,
          "text": "ja altijd, welke"
        },
        {
          "mine": false,
          "text": "iets grappigs, ik ben klaar met drama"
        },
        {
          "mine": true,
          "text": "haha oke ik zoek wat uit"
        },
        {
          "mine": false,
          "text": "top ik zorg voor snacks"
        }
      ]
    },
    {
      "name": "Doortje",
      "messages": [
        {
          "mine": true,
          "text": "kom je nog langs met de hond"
        },
        {
          "mine": false,
          "text": "ja hij wil graag spelen met die van jou"
        },
        {
          "mine": true,
          "text": "haha schattig, wanneer"
        },
        {
          "mine": false,
          "text": "morgenmiddag in het park?"
        },
        {
          "mine": true,
          "text": "top tot dan"
        }
      ]
    },
    {
      "name": "Boris",
      "messages": [
        {
          "mine": false,
          "text": "man je moet die nieuwe plek proberen"
        },
        {
          "mine": true,
          "text": "welke plek"
        },
        {
          "mine": false,
          "text": "die burgertent in het centrum"
        },
        {
          "mine": true,
          "text": "oh die, is ie goed?"
        },
        {
          "mine": false,
          "text": "beste burger van mijn leven niet overdreven"
        },
        {
          "mine": true,
          "text": "oke overtuigd, gaan we samen"
        }
      ]
    },
    {
      "name": "Lynn",
      "messages": [
        {
          "mine": true,
          "text": "hoe laat zie ik je morgen"
        },
        {
          "mine": false,
          "text": "rond 12 bij mij?"
        },
        {
          "mine": true,
          "text": "oke moet ik iets meenemen"
        },
        {
          "mine": false,
          "text": "nee ik heb alles, gewoon komen"
        },
        {
          "mine": true,
          "text": "top tot morgen"
        }
      ]
    },
    {
      "name": "Job",
      "messages": [
        {
          "mine": false,
          "text": "kom je nog naar de repetitie"
        },
        {
          "mine": true,
          "text": "ja ben onderweg, sorry laat"
        },
        {
          "mine": false,
          "text": "geen probleem we beginnen net"
        },
        {
          "mine": true,
          "text": "top ben er zo"
        }
      ]
    },
    {
      "name": "Hidde",
      "messages": [
        {
          "mine": true,
          "text": "heb je zin om te vissen zondag"
        },
        {
          "mine": false,
          "text": "haha vissen? sinds wanneer"
        },
        {
          "mine": true,
          "text": "nieuwe hobby, ga mee dan"
        },
        {
          "mine": false,
          "text": "oke waarom niet, hoe vroeg"
        },
        {
          "mine": true,
          "text": "6 uur"
        },
        {
          "mine": false,
          "text": "6 uur?? je bent gek"
        }
      ]
    },
    {
      "name": "Fleur werk",
      "messages": [
        {
          "mine": false,
          "text": "kom je zo even naar mijn bureau"
        },
        {
          "mine": true,
          "text": "ja waarvoor"
        },
        {
          "mine": false,
          "text": "gewoon iets bespreken over dat project"
        },
        {
          "mine": true,
          "text": "oke ben er zo"
        }
      ]
    }
  ],
  "pl": [
    {
      "name": "Kasia",
      "messages": [
        {
          "mine": false,
          "text": "jesteś już w domu?"
        },
        {
          "mine": true,
          "text": "nie jeszcze, zaraz wychodzę z pracy"
        },
        {
          "mine": false,
          "text": "ok bo chciałam wpaść na chwilę"
        },
        {
          "mine": true,
          "text": "wpadaj spoko, będę za 40 min"
        },
        {
          "mine": false,
          "text": "no to lecę"
        }
      ]
    },
    {
      "name": "Michał",
      "messages": [
        {
          "mine": true,
          "text": "stary widziałeś ten mecz wczoraj"
        },
        {
          "mine": false,
          "text": "nieee zaspałem xd co się działo"
        },
        {
          "mine": true,
          "text": "w ostatniej minucie karny, masakra"
        },
        {
          "mine": false,
          "text": " nooo szkoda że przegapiłem"
        },
        {
          "mine": true,
          "text": "muszę ci pokazać powtórkę"
        }
      ]
    },
    {
      "name": "Ola ❤️",
      "messages": [
        {
          "mine": false,
          "text": "tęsknię"
        },
        {
          "mine": true,
          "text": "ja bardziej"
        },
        {
          "mine": false,
          "text": "kupisz coś na kolację po drodze?"
        },
        {
          "mine": true,
          "text": "jasne, masz ochotę na coś konkretnego?"
        },
        {
          "mine": false,
          "text": "może makaron"
        },
        {
          "mine": true,
          "text": "robi się"
        }
      ]
    },
    {
      "name": "Kuba",
      "messages": [
        {
          "mine": true,
          "text": "siema będziesz jutro na treningu"
        },
        {
          "mine": false,
          "text": "chyba tak a o której"
        },
        {
          "mine": true,
          "text": "18"
        },
        {
          "mine": false,
          "text": "spoko to widzimy się"
        }
      ]
    },
    {
      "name": "Zosia",
      "messages": [
        {
          "mine": false,
          "text": "ej pamiętasz jak nazywała się ta kawiarnia"
        },
        {
          "mine": true,
          "text": "ta koło rynku? nie mam pojęcia"
        },
        {
          "mine": false,
          "text": "no ta z tym dobrym sernikiem"
        },
        {
          "mine": true,
          "text": "aaa czekaj chyba coś jak drukarnia"
        },
        {
          "mine": false,
          "text": "tak! dzięki"
        }
      ]
    },
    {
      "name": "Gosia",
      "messages": [
        {
          "mine": true,
          "text": "co robisz"
        },
        {
          "mine": false,
          "text": "leżę nic mi się nie chce"
        },
        {
          "mine": true,
          "text": "same tu"
        },
        {
          "mine": false,
          "text": "moze wyjdziemy na spacer wieczorem"
        },
        {
          "mine": true,
          "text": "no może, zobaczę jak się będę czuła"
        }
      ]
    },
    {
      "name": "Bartek",
      "messages": [
        {
          "mine": false,
          "text": "masz może ładowarkę do usb c"
        },
        {
          "mine": true,
          "text": "mam, w plecaku"
        },
        {
          "mine": false,
          "text": "podrzucisz jutro?"
        },
        {
          "mine": true,
          "text": "no jasne"
        }
      ]
    },
    {
      "name": "Madzia",
      "messages": [
        {
          "mine": true,
          "text": "widziałaś co ona wrzuciła na story"
        },
        {
          "mine": false,
          "text": "noo widziałam, dramat xd"
        },
        {
          "mine": true,
          "text": "no ludzie"
        },
        {
          "mine": false,
          "text": "muszę ci coś opowiedzieć jak się spotkamy"
        },
        {
          "mine": true,
          "text": "mów teraz nie wytrzymam"
        },
        {
          "mine": false,
          "text": "nie no na żywo"
        }
      ]
    },
    {
      "name": "Wojtek",
      "messages": [
        {
          "mine": false,
          "text": "grasz wieczorem?"
        },
        {
          "mine": true,
          "text": "moge o 21"
        },
        {
          "mine": false,
          "text": "spoko odezwij się jak siądziesz"
        },
        {
          "mine": true,
          "text": "git"
        }
      ]
    },
    {
      "name": "Mama",
      "messages": [
        {
          "mine": false,
          "text": "jadłeś coś?"
        },
        {
          "mine": true,
          "text": "tak mamo jadłem spokojnie"
        },
        {
          "mine": false,
          "text": "to dobrze, przyjedziesz w niedzielę?"
        },
        {
          "mine": true,
          "text": "postaram się, dam znać w piątek"
        },
        {
          "mine": false,
          "text": "no dobrze buziaki"
        }
      ]
    },
    {
      "name": "Tata",
      "messages": [
        {
          "mine": true,
          "text": "cześć tato jak tam auto działa"
        },
        {
          "mine": false,
          "text": "wszystko gra, dzięki że pomogłeś"
        },
        {
          "mine": true,
          "text": "spoko, jakby co dzwoń"
        },
        {
          "mine": false,
          "text": "dam znać"
        }
      ]
    },
    {
      "name": "Babcia",
      "messages": [
        {
          "mine": false,
          "text": "wnusiu przyjdziesz na obiad w niedziele"
        },
        {
          "mine": true,
          "text": "przyjdę babciu, będzie rosół?"
        },
        {
          "mine": false,
          "text": "będzie oczywiście, twój ulubiony"
        },
        {
          "mine": true,
          "text": "super, nie mogę się doczekać"
        }
      ]
    },
    {
      "name": "Dziadek",
      "messages": [
        {
          "mine": true,
          "text": "dziadku znalazłem te zdjęcia o których mówiłeś"
        },
        {
          "mine": false,
          "text": "o super, przynieś jak wpadniesz"
        },
        {
          "mine": true,
          "text": "jasne wezmę je w weekend"
        },
        {
          "mine": false,
          "text": "dziękuję"
        }
      ]
    },
    {
      "name": "Ania studia",
      "messages": [
        {
          "mine": false,
          "text": "masz notatki z wykładu"
        },
        {
          "mine": true,
          "text": "mam ale trochę chaotyczne xd"
        },
        {
          "mine": false,
          "text": "cokolwiek lepsze niż nic"
        },
        {
          "mine": true,
          "text": "podeślę ci wieczorem"
        },
        {
          "mine": false,
          "text": "ratujesz mi życie"
        }
      ]
    },
    {
      "name": "Jurek chata",
      "messages": [
        {
          "mine": true,
          "text": "ej płacimy już za prąd czy jeszcze nie"
        },
        {
          "mine": false,
          "text": "przyszło wczoraj, ogarnę i podeślę ci kwotę"
        },
        {
          "mine": true,
          "text": "ok dzięki"
        },
        {
          "mine": false,
          "text": "nie ma sprawy"
        }
      ]
    },
    {
      "name": "Max praca",
      "messages": [
        {
          "mine": false,
          "text": "będziesz na tym callu o 10?"
        },
        {
          "mine": true,
          "text": "będę, tylko zrobię se najpierw kawę"
        },
        {
          "mine": false,
          "text": "haha rozumiem"
        },
        {
          "mine": true,
          "text": "za chwilę wchodzę"
        }
      ]
    },
    {
      "name": "Sara siłka",
      "messages": [
        {
          "mine": true,
          "text": "idziesz dzisiaj?"
        },
        {
          "mine": false,
          "text": "no jasne, klata dziś"
        },
        {
          "mine": true,
          "text": "to widzimy się o 17"
        },
        {
          "mine": false,
          "text": "essa"
        }
      ]
    },
    {
      "name": "kochanie",
      "messages": [
        {
          "mine": false,
          "text": "gdzie jesteś"
        },
        {
          "mine": true,
          "text": "w sklepie, biorę wino"
        },
        {
          "mine": false,
          "text": "weź jeszcze coś słodkiego"
        },
        {
          "mine": true,
          "text": "już biorę"
        },
        {
          "mine": false,
          "text": "kocham ❤️"
        }
      ]
    },
    {
      "name": "misiu",
      "messages": [
        {
          "mine": true,
          "text": "co dziś na obiad"
        },
        {
          "mine": false,
          "text": "myślałam o pierogach"
        },
        {
          "mine": true,
          "text": "ooo tak, ruskie?"
        },
        {
          "mine": false,
          "text": "no pewnie"
        }
      ]
    },
    {
      "name": "chata",
      "messages": [
        {
          "mine": false,
          "text": "kto zjadł moje jajka"
        },
        {
          "mine": true,
          "text": "nie ja przysięgam"
        },
        {
          "mine": false,
          "text": "no ktoś zjadł"
        },
        {
          "mine": true,
          "text": "kuba to na 100%"
        },
        {
          "mine": false,
          "text": "haha wsypa"
        },
        {
          "mine": true,
          "text": "kupię nowe spokojnie"
        }
      ]
    },
    {
      "name": "rodzinka",
      "messages": [
        {
          "mine": false,
          "text": "kto przyjeżdża w sobotę?"
        },
        {
          "mine": true,
          "text": "ja będę z Olą"
        },
        {
          "mine": false,
          "text": "my też jesteśmy"
        },
        {
          "mine": true,
          "text": "super to robimy grilla"
        },
        {
          "mine": false,
          "text": "biorę kiełbaski"
        }
      ]
    },
    {
      "name": "dziewczyny",
      "messages": [
        {
          "mine": true,
          "text": "spotykamy się w piątek?"
        },
        {
          "mine": false,
          "text": "ja mogę"
        },
        {
          "mine": false,
          "text": "ja też ale później"
        },
        {
          "mine": true,
          "text": "to o 20 u mnie"
        },
        {
          "mine": false,
          "text": "biorę wino"
        },
        {
          "mine": false,
          "text": "essa"
        }
      ]
    },
    {
      "name": "piłka",
      "messages": [
        {
          "mine": false,
          "text": "jutro gramy o której"
        },
        {
          "mine": true,
          "text": "19 na orliku"
        },
        {
          "mine": false,
          "text": "ilu nas jest"
        },
        {
          "mine": true,
          "text": "na razie 8"
        },
        {
          "mine": false,
          "text": "musimy dobrać jeszcze dwóch"
        }
      ]
    },
    {
      "name": "ekipa",
      "messages": [
        {
          "mine": true,
          "text": "wyjazd w wakacje dalej aktualny?"
        },
        {
          "mine": false,
          "text": "no pewnie"
        },
        {
          "mine": false,
          "text": "kto ogarnia noclegi"
        },
        {
          "mine": true,
          "text": "ja mogę popatrzeć"
        },
        {
          "mine": false,
          "text": "złoto"
        }
      ]
    },
    {
      "name": "Piotrek",
      "messages": [
        {
          "mine": false,
          "text": "oddasz mi tą kasę?"
        },
        {
          "mine": true,
          "text": "kurde zapomniałem, jutro na sto pro"
        },
        {
          "mine": false,
          "text": "spoko luz"
        },
        {
          "mine": true,
          "text": "sorki"
        }
      ]
    },
    {
      "name": "Natalia",
      "messages": [
        {
          "mine": true,
          "text": "widziałaś że otworzyli nową knajpę"
        },
        {
          "mine": false,
          "text": "gdzie?"
        },
        {
          "mine": true,
          "text": "koło parku, podobno dobra"
        },
        {
          "mine": false,
          "text": "to musimy sprawdzić w weekend"
        },
        {
          "mine": true,
          "text": "wpisuję do kalendarza xd"
        }
      ]
    },
    {
      "name": "Dominik",
      "messages": [
        {
          "mine": false,
          "text": "będziesz na urodzinach"
        },
        {
          "mine": true,
          "text": "będę, o której zaczynacie"
        },
        {
          "mine": false,
          "text": "koło 19"
        },
        {
          "mine": true,
          "text": "spoko wpadnę"
        }
      ]
    },
    {
      "name": "Karolina",
      "messages": [
        {
          "mine": true,
          "text": "ej co u ciebie dawno się nie odzywałaś"
        },
        {
          "mine": false,
          "text": "wiem sorry, dużo się działo w pracy"
        },
        {
          "mine": true,
          "text": "musimy się spotkać"
        },
        {
          "mine": false,
          "text": "tak tak, może następny tydzień"
        },
        {
          "mine": true,
          "text": "trzymam za słowo"
        }
      ]
    },
    {
      "name": "Marek",
      "messages": [
        {
          "mine": false,
          "text": "masz wiertarkę?"
        },
        {
          "mine": true,
          "text": "mam, wpadnij po nią kiedy chcesz"
        },
        {
          "mine": false,
          "text": "dzięki wielkie, jutro wpadnę"
        },
        {
          "mine": true,
          "text": "git"
        }
      ]
    },
    {
      "name": "Ewa",
      "messages": [
        {
          "mine": true,
          "text": "śpisz już?"
        },
        {
          "mine": false,
          "text": "nie no leżę tylko"
        },
        {
          "mine": true,
          "text": "nie mogę zasnąć wgl"
        },
        {
          "mine": false,
          "text": "same, ta kawa po południu to był błąd xd"
        }
      ]
    },
    {
      "name": "Tomek",
      "messages": [
        {
          "mine": false,
          "text": "gdzie jesteś miałeś być 20 min temu"
        },
        {
          "mine": true,
          "text": "korki masakra, już jadę"
        },
        {
          "mine": false,
          "text": "ok czekam"
        },
        {
          "mine": true,
          "text": "zaraz jestem"
        }
      ]
    },
    {
      "name": "Magda",
      "messages": [
        {
          "mine": true,
          "text": "kupiłaś już prezent dla mamy"
        },
        {
          "mine": false,
          "text": "jeszcze nie, kompletnie nie mam pomysłu"
        },
        {
          "mine": true,
          "text": "może perfumy"
        },
        {
          "mine": false,
          "text": "o to dobry pomysł, wchodzę w to"
        }
      ]
    },
    {
      "name": "Paweł",
      "messages": [
        {
          "mine": false,
          "text": "stary masz jakieś plany na weekend"
        },
        {
          "mine": true,
          "text": "raczej nie, a co"
        },
        {
          "mine": false,
          "text": "myślałem żeby wyskoczyć w góry"
        },
        {
          "mine": true,
          "text": "o w to mi graj, gadamy jutro"
        }
      ]
    },
    {
      "name": "Justyna",
      "messages": [
        {
          "mine": true,
          "text": "jak poszedł egzamin"
        },
        {
          "mine": false,
          "text": "chyba dobrze, ale się stresowałam masakra"
        },
        {
          "mine": true,
          "text": "na pewno zdałaś"
        },
        {
          "mine": false,
          "text": "oby, wyniki za tydzień"
        }
      ]
    },
    {
      "name": "Adam",
      "messages": [
        {
          "mine": false,
          "text": "?"
        },
        {
          "mine": true,
          "text": "no o co chodzi"
        },
        {
          "mine": false,
          "text": "napisałeś do mnie i nic"
        },
        {
          "mine": true,
          "text": "aaa sorry kliknęło się xd"
        }
      ]
    },
    {
      "name": "Weronika",
      "messages": [
        {
          "mine": true,
          "text": "masz może przepis na te ciasteczka"
        },
        {
          "mine": false,
          "text": "mam, podeślę ci wieczorem"
        },
        {
          "mine": true,
          "text": "super dzięki, chcę upiec na jutro"
        },
        {
          "mine": false,
          "text": "dasz radę są proste"
        }
      ]
    },
    {
      "name": "Kamil",
      "messages": [
        {
          "mine": false,
          "text": "idziesz na koncert"
        },
        {
          "mine": true,
          "text": "chcę ale bilety drogie"
        },
        {
          "mine": false,
          "text": "no trochę są"
        },
        {
          "mine": true,
          "text": "zobaczę do jutra, dam znać"
        }
      ]
    },
    {
      "name": "Patrycja",
      "messages": [
        {
          "mine": true,
          "text": "ej pomożesz mi z przeprowadzką w sobotę"
        },
        {
          "mine": false,
          "text": "mogę, o której"
        },
        {
          "mine": true,
          "text": "od rana, koło 9"
        },
        {
          "mine": false,
          "text": "spoko będę, zabiorę rękawiczki xd"
        },
        {
          "mine": true,
          "text": "jesteś kochana"
        }
      ]
    },
    {
      "name": "Grzesiek",
      "messages": [
        {
          "mine": false,
          "text": "no i co robimy dziś"
        },
        {
          "mine": true,
          "text": "nie wiem, może kino"
        },
        {
          "mine": false,
          "text": "co grają"
        },
        {
          "mine": true,
          "text": "sprawdzę i ci powiem"
        }
      ]
    },
    {
      "name": "Iza",
      "messages": [
        {
          "mine": true,
          "text": "spałaś dobrze?"
        },
        {
          "mine": false,
          "text": "nie za bardzo, sąsiedzi znowu hałasowali"
        },
        {
          "mine": true,
          "text": "ojej, znowu impreza?"
        },
        {
          "mine": false,
          "text": "no do 3 w nocy"
        },
        {
          "mine": true,
          "text": "biedna"
        }
      ]
    },
    {
      "name": "Sebastian",
      "messages": [
        {
          "mine": false,
          "text": "przyniesiesz jutro ten kabel"
        },
        {
          "mine": true,
          "text": "no dobra, przypomnij mi rano"
        },
        {
          "mine": false,
          "text": "przypomnę spokojnie"
        },
        {
          "mine": true,
          "text": "git"
        }
      ]
    },
    {
      "name": "Monika",
      "messages": [
        {
          "mine": true,
          "text": "widziałaś jaka pogoda ma być w weekend"
        },
        {
          "mine": false,
          "text": "nie, dobra?"
        },
        {
          "mine": true,
          "text": "25 stopni i słońce"
        },
        {
          "mine": false,
          "text": "ooo to grill obowiązkowy"
        }
      ]
    },
    {
      "name": "Rafał",
      "messages": [
        {
          "mine": false,
          "text": "grasz w sobotę czy odpadasz"
        },
        {
          "mine": true,
          "text": "gram gram"
        },
        {
          "mine": false,
          "text": "no to git bo brakowało nam ludzi"
        },
        {
          "mine": true,
          "text": "spoko będę"
        }
      ]
    },
    {
      "name": "Agnieszka",
      "messages": [
        {
          "mine": true,
          "text": "co u ciebie słychać"
        },
        {
          "mine": false,
          "text": "po staremu, praca dom praca"
        },
        {
          "mine": true,
          "text": "znam to aż za dobrze"
        },
        {
          "mine": false,
          "text": "trzeba to jakoś przełamać"
        },
        {
          "mine": true,
          "text": "wyskoczmy gdzieś w weekend"
        }
      ]
    },
    {
      "name": "Łukasz",
      "messages": [
        {
          "mine": false,
          "text": "byłeś już u fryzjera przed weselem"
        },
        {
          "mine": true,
          "text": "nie jeszcze, w piątek idę"
        },
        {
          "mine": false,
          "text": "haha ja też ciągnę do ostatniej chwili"
        },
        {
          "mine": true,
          "text": "typowo my"
        }
      ]
    },
    {
      "name": "Basia",
      "messages": [
        {
          "mine": true,
          "text": "podrzucisz mnie jutro na dworzec"
        },
        {
          "mine": false,
          "text": "o której masz pociąg"
        },
        {
          "mine": true,
          "text": "kwadrans po siódmej"
        },
        {
          "mine": false,
          "text": "wcześnie ale dobra, bądź gotowa wcześniej"
        },
        {
          "mine": true,
          "text": "dziękuję kochana"
        }
      ]
    },
    {
      "name": "Damian",
      "messages": [
        {
          "mine": false,
          "text": "widziałeś memy z tej grupy"
        },
        {
          "mine": true,
          "text": "haha te z kotem?"
        },
        {
          "mine": false,
          "text": "no płakałem"
        },
        {
          "mine": true,
          "text": "genialne"
        }
      ]
    },
    {
      "name": "Sylwia",
      "messages": [
        {
          "mine": true,
          "text": "kupiłam bilety na ten wyjazd"
        },
        {
          "mine": false,
          "text": "serio?! super"
        },
        {
          "mine": true,
          "text": "no nie mogłam się doczekać"
        },
        {
          "mine": false,
          "text": "ile jestem ci winna"
        },
        {
          "mine": true,
          "text": "podliczę i ci powiem"
        }
      ]
    },
    {
      "name": "Krzysiek",
      "messages": [
        {
          "mine": false,
          "text": "masz chwilę pogadać"
        },
        {
          "mine": true,
          "text": "teraz nie bardzo, oddzwonię wieczorem"
        },
        {
          "mine": false,
          "text": "spoko nic pilnego"
        },
        {
          "mine": true,
          "text": "to gadamy później"
        }
      ]
    },
    {
      "name": "Dorota",
      "messages": [
        {
          "mine": true,
          "text": "gdzie się podziałaś, dzwoniłam"
        },
        {
          "mine": false,
          "text": "byłam pod prysznicem sorry"
        },
        {
          "mine": true,
          "text": "aaa spoko, oddzwoń jak możesz"
        },
        {
          "mine": false,
          "text": "już dzwonię"
        }
      ]
    },
    {
      "name": "Mateusz",
      "messages": [
        {
          "mine": false,
          "text": "stary pożyczysz mi 50zł do jutra"
        },
        {
          "mine": true,
          "text": "jasne wysyłam"
        },
        {
          "mine": false,
          "text": "wielkie dzięki, oddam z nawiązką"
        },
        {
          "mine": true,
          "text": "spoko luz"
        }
      ]
    },
    {
      "name": "Klaudia",
      "messages": [
        {
          "mine": true,
          "text": "co słychać obco"
        },
        {
          "mine": false,
          "text": "haha wiem, wszystko dobrze a u ciebie"
        },
        {
          "mine": true,
          "text": "też, tylko roboty od cholery"
        },
        {
          "mine": false,
          "text": "trzymaj się, niedługo weekend"
        }
      ]
    },
    {
      "name": "Filip",
      "messages": [
        {
          "mine": false,
          "text": "będziesz jutro na uczelni"
        },
        {
          "mine": true,
          "text": "no muszę, mam kolokwium"
        },
        {
          "mine": false,
          "text": "aaa to powodzenia"
        },
        {
          "mine": true,
          "text": "dzięki, przyda się"
        }
      ]
    },
    {
      "name": "Julka",
      "messages": [
        {
          "mine": true,
          "text": "widziałaś tę sukienkę co ci wysłałam"
        },
        {
          "mine": false,
          "text": "tak, śliczna!"
        },
        {
          "mine": true,
          "text": "wahałam się czy brać"
        },
        {
          "mine": false,
          "text": "bierz na sto procent"
        },
        {
          "mine": true,
          "text": "no dobra przekonałaś mnie"
        }
      ]
    },
    {
      "name": "Norbert",
      "messages": [
        {
          "mine": false,
          "text": "co tam robisz w ten weekend"
        },
        {
          "mine": true,
          "text": "nic konkretnego"
        },
        {
          "mine": false,
          "text": "to może na rowery"
        },
        {
          "mine": true,
          "text": "o czemu nie, gadamy"
        }
      ]
    },
    {
      "name": "Ala",
      "messages": [
        {
          "mine": true,
          "text": "ej masz może parasol na jutro"
        },
        {
          "mine": false,
          "text": "mam dwa, jeden ci dam"
        },
        {
          "mine": false,
          "text": "podobno ma lać cały dzień"
        },
        {
          "mine": true,
          "text": "no właśnie, dzięki"
        }
      ]
    },
    {
      "name": "Konrad",
      "messages": [
        {
          "mine": false,
          "text": "oddałeś książkę do biblioteki?"
        },
        {
          "mine": true,
          "text": "kurde nie, termin był wczoraj"
        },
        {
          "mine": false,
          "text": "haha będzie kara"
        },
        {
          "mine": true,
          "text": "wiem, głupota moja"
        }
      ]
    },
    {
      "name": "Ela",
      "messages": [
        {
          "mine": true,
          "text": "przyjdziesz na kawę dziś?"
        },
        {
          "mine": false,
          "text": "chętnie, o której pasuje"
        },
        {
          "mine": true,
          "text": "koło 16"
        },
        {
          "mine": false,
          "text": "spoko, będę"
        }
      ]
    },
    {
      "name": "Przemek",
      "messages": [
        {
          "mine": false,
          "text": "widziałeś ile kosztuje teraz paliwo"
        },
        {
          "mine": true,
          "text": "nie mów, dramat"
        },
        {
          "mine": false,
          "text": "coraz drożej"
        },
        {
          "mine": true,
          "text": "trzeba przesiąść się na rower xd"
        }
      ]
    },
    {
      "name": "Marta",
      "messages": [
        {
          "mine": true,
          "text": "gdzie się umawiamy na jutro"
        },
        {
          "mine": false,
          "text": "może pod tą fontanną w centrum"
        },
        {
          "mine": true,
          "text": "spoko, o 12?"
        },
        {
          "mine": false,
          "text": "pasuje, do jutra"
        }
      ]
    },
    {
      "name": "Szymon",
      "messages": [
        {
          "mine": false,
          "text": "masz jakieś fajne seriale do polecenia"
        },
        {
          "mine": true,
          "text": "zależy co lubisz"
        },
        {
          "mine": false,
          "text": "coś lekkiego na wieczór"
        },
        {
          "mine": true,
          "text": "to mam idealny, wyślę ci tytuł"
        }
      ]
    },
    {
      "name": "Nina",
      "messages": [
        {
          "mine": true,
          "text": "tak mi się nudzi w pracy dziś"
        },
        {
          "mine": false,
          "text": "haha to samo, patrzę w ekran i nic"
        },
        {
          "mine": true,
          "text": "kiedy ten piątek"
        },
        {
          "mine": false,
          "text": "za wolno leci"
        }
      ]
    },
    {
      "name": "Oskar",
      "messages": [
        {
          "mine": false,
          "text": "byłeś już na tej nowej pizzy"
        },
        {
          "mine": true,
          "text": "jeszcze nie, dobra?"
        },
        {
          "mine": false,
          "text": "masakra jaka dobra, musimy iść"
        },
        {
          "mine": true,
          "text": "to w tym tygodniu"
        }
      ]
    },
    {
      "name": "Wiktoria",
      "messages": [
        {
          "mine": true,
          "text": "pomożesz mi z tym projektem"
        },
        {
          "mine": false,
          "text": "mogę, na kiedy to"
        },
        {
          "mine": true,
          "text": "na przyszły poniedziałek"
        },
        {
          "mine": false,
          "text": "spoko damy radę, spotkajmy się w weekend"
        }
      ]
    },
    {
      "name": "Igor",
      "messages": [
        {
          "mine": false,
          "text": "idziesz dziś na trening?"
        },
        {
          "mine": true,
          "text": "nie, coś mnie rozłożyło"
        },
        {
          "mine": false,
          "text": "ojej, kuruj się"
        },
        {
          "mine": true,
          "text": "dzięki, jutro wrócę do formy"
        }
      ]
    },
    {
      "name": "Emilia",
      "messages": [
        {
          "mine": true,
          "text": "widziałaś ile ludzi było na tym ślubie"
        },
        {
          "mine": false,
          "text": "no masa, pięknie było"
        },
        {
          "mine": true,
          "text": "i to jedzenie"
        },
        {
          "mine": false,
          "text": "objadłam się totalnie xd"
        }
      ]
    },
    {
      "name": "Antek",
      "messages": [
        {
          "mine": false,
          "text": "pożyczysz mi namiot na wyjazd"
        },
        {
          "mine": true,
          "text": "jasne, tylko przypomnij bo zapomnę"
        },
        {
          "mine": false,
          "text": "będę męczył codziennie xd"
        },
        {
          "mine": true,
          "text": "haha dobra dobra"
        }
      ]
    },
    {
      "name": "Lena",
      "messages": [
        {
          "mine": true,
          "text": "co porabiasz"
        },
        {
          "mine": false,
          "text": "sprzątam mieszkanie, dramat"
        },
        {
          "mine": true,
          "text": "haha ja to odkładam od tygodnia"
        },
        {
          "mine": false,
          "text": "no ja już nie mogłam patrzeć"
        }
      ]
    },
    {
      "name": "Franek",
      "messages": [
        {
          "mine": false,
          "text": "gramy dziś czy nie"
        },
        {
          "mine": true,
          "text": "gramy, siadam za godzinę"
        },
        {
          "mine": false,
          "text": "spoko, czekam"
        },
        {
          "mine": true,
          "text": "za momencik"
        }
      ]
    },
    {
      "name": "Hania",
      "messages": [
        {
          "mine": true,
          "text": "kupisz mleko po drodze?"
        },
        {
          "mine": false,
          "text": "kupię, coś jeszcze?"
        },
        {
          "mine": true,
          "text": "i chleb"
        },
        {
          "mine": false,
          "text": "ok robi się"
        }
      ]
    },
    {
      "name": "Staszek",
      "messages": [
        {
          "mine": false,
          "text": "co u ciebie stary kopie"
        },
        {
          "mine": true,
          "text": "wszystko gra, dawno się nie widzieliśmy"
        },
        {
          "mine": false,
          "text": "no trzeba to nadrobić"
        },
        {
          "mine": true,
          "text": "piwo w weekend?"
        },
        {
          "mine": false,
          "text": "wchodzę"
        }
      ]
    },
    {
      "name": "Zuza",
      "messages": [
        {
          "mine": true,
          "text": "widziałaś moją wiadomość sprzed godziny"
        },
        {
          "mine": false,
          "text": "sorry dopiero teraz, byłam zajęta"
        },
        {
          "mine": true,
          "text": "spoko, chciałam tylko pogadać"
        },
        {
          "mine": false,
          "text": "dzwonię za chwilę"
        }
      ]
    },
    {
      "name": "Olek",
      "messages": [
        {
          "mine": false,
          "text": "masz plan na wieczór"
        },
        {
          "mine": true,
          "text": "chyba zostaję w domu"
        },
        {
          "mine": false,
          "text": "nudziarz xd"
        },
        {
          "mine": true,
          "text": "haha jestem zmęczony"
        }
      ]
    },
    {
      "name": "Marysia",
      "messages": [
        {
          "mine": true,
          "text": "przyniosłaś mi tę książkę?"
        },
        {
          "mine": false,
          "text": "aaa zapomniałam, sorry"
        },
        {
          "mine": true,
          "text": "nic, przyniesiesz jutro"
        },
        {
          "mine": false,
          "text": "obiecuję że nie zapomnę"
        }
      ]
    },
    {
      "name": "Jasiek",
      "messages": [
        {
          "mine": false,
          "text": "będziesz jutro w pracy?"
        },
        {
          "mine": true,
          "text": "będę czemu"
        },
        {
          "mine": false,
          "text": "bo mam dla ciebie coś"
        },
        {
          "mine": true,
          "text": "ooo ciekawe, nie mów co"
        }
      ]
    },
    {
      "name": "Kinga",
      "messages": [
        {
          "mine": true,
          "text": "ej ta impreza dalej aktualna"
        },
        {
          "mine": false,
          "text": "no pewnie, u Oli"
        },
        {
          "mine": true,
          "text": "to o której"
        },
        {
          "mine": false,
          "text": "koło 20"
        },
        {
          "mine": true,
          "text": "będę"
        }
      ]
    },
    {
      "name": "Bartosz siłka",
      "messages": [
        {
          "mine": false,
          "text": "robisz dziś nogi?"
        },
        {
          "mine": true,
          "text": "no dziś dzień nóg, będzie bolało xd"
        },
        {
          "mine": false,
          "text": "haha jutro nie wstaniesz"
        },
        {
          "mine": true,
          "text": "typowo"
        }
      ]
    },
    {
      "name": "Ala sąsiadka",
      "messages": [
        {
          "mine": true,
          "text": "podlejesz mi kwiaty jak wyjadę?"
        },
        {
          "mine": false,
          "text": "jasne, zostaw klucz pod wycieraczką"
        },
        {
          "mine": true,
          "text": "dziękuję bardzo, oddam się jakoś"
        },
        {
          "mine": false,
          "text": "nie ma sprawy, sąsiedzka pomoc"
        }
      ]
    },
    {
      "name": "Kuba studia",
      "messages": [
        {
          "mine": false,
          "text": "masz odpowiedzi do tego kolosa"
        },
        {
          "mine": true,
          "text": "mam część, wyślę ci"
        },
        {
          "mine": false,
          "text": "ratunku dziękuję"
        },
        {
          "mine": true,
          "text": "spoko, tylko nie mów nikomu xd"
        }
      ]
    },
    {
      "name": "Ewelina",
      "messages": [
        {
          "mine": true,
          "text": "co dziś na siebie założyć, nie mam pomysłu"
        },
        {
          "mine": false,
          "text": "ta czarna sukienka zawsze git"
        },
        {
          "mine": true,
          "text": "racja, dzięki"
        },
        {
          "mine": false,
          "text": "będziesz wyglądać super"
        }
      ]
    },
    {
      "name": "Radek",
      "messages": [
        {
          "mine": false,
          "text": "widziałeś nowego iphona"
        },
        {
          "mine": true,
          "text": "no i drogi jak zawsze"
        },
        {
          "mine": false,
          "text": "haha no ale ładny"
        },
        {
          "mine": true,
          "text": "poczekam na przecenę"
        }
      ]
    },
    {
      "name": "Ada",
      "messages": [
        {
          "mine": true,
          "text": "spotkamy się na kawie w sobotę?"
        },
        {
          "mine": false,
          "text": "chętnie, mam wolne rano"
        },
        {
          "mine": true,
          "text": "to o 10 w tej naszej"
        },
        {
          "mine": false,
          "text": "idealnie"
        }
      ]
    },
    {
      "name": "Wiktor",
      "messages": [
        {
          "mine": false,
          "text": "stary masz pilota od tego rzutnika"
        },
        {
          "mine": true,
          "text": "chyba został u ciebie"
        },
        {
          "mine": false,
          "text": "aaa faktycznie znalazłem"
        },
        {
          "mine": true,
          "text": "haha typowo"
        }
      ]
    },
    {
      "name": "Dagmara",
      "messages": [
        {
          "mine": true,
          "text": "jak się czujesz po wczoraj"
        },
        {
          "mine": false,
          "text": "głowa mnie boli, za dużo tańca xd"
        },
        {
          "mine": true,
          "text": "haha ale było warto"
        },
        {
          "mine": false,
          "text": "no było super"
        }
      ]
    },
    {
      "name": "Miłosz",
      "messages": [
        {
          "mine": false,
          "text": "idziesz jutro biegać?"
        },
        {
          "mine": true,
          "text": "jak nie będzie padać to tak"
        },
        {
          "mine": false,
          "text": "ma być ładnie"
        },
        {
          "mine": true,
          "text": "to git, o 7 rano?"
        },
        {
          "mine": false,
          "text": "może być"
        }
      ]
    },
    {
      "name": "Aleksandra praca",
      "messages": [
        {
          "mine": true,
          "text": "wysłałaś już ten raport?"
        },
        {
          "mine": false,
          "text": "wysyłam za 5 minut, kończę"
        },
        {
          "mine": true,
          "text": "spoko, dzięki"
        },
        {
          "mine": false,
          "text": "nie ma za co"
        }
      ]
    },
    {
      "name": "Tymek",
      "messages": [
        {
          "mine": false,
          "text": "masz może zapasowe słuchawki"
        },
        {
          "mine": true,
          "text": "mam stare, chcesz?"
        },
        {
          "mine": false,
          "text": "biorę wszystko, moje padły"
        },
        {
          "mine": true,
          "text": "haha przyniosę jutro"
        }
      ]
    },
    {
      "name": "Roksana",
      "messages": [
        {
          "mine": true,
          "text": "widziałaś że pada śnieg?"
        },
        {
          "mine": false,
          "text": "w lipcu? xd"
        },
        {
          "mine": true,
          "text": "haha nie, w mojej głowie"
        },
        {
          "mine": false,
          "text": "wariatka"
        }
      ]
    },
    {
      "name": "Błażej",
      "messages": [
        {
          "mine": false,
          "text": "co robimy z tym biletem"
        },
        {
          "mine": true,
          "text": "sprzedajmy komuś, szkoda żeby przepadł"
        },
        {
          "mine": false,
          "text": "wrzucę na grupę"
        },
        {
          "mine": true,
          "text": "dobry pomysł"
        }
      ]
    },
    {
      "name": "Sandra",
      "messages": [
        {
          "mine": true,
          "text": "przyjdziesz do mnie dziś?"
        },
        {
          "mine": false,
          "text": "mogę wpaść wieczorem"
        },
        {
          "mine": true,
          "text": "super, zamówimy sushi"
        },
        {
          "mine": false,
          "text": "ooo tak"
        }
      ]
    },
    {
      "name": "Cezary",
      "messages": [
        {
          "mine": false,
          "text": "grasz dziś w karty u chłopaków"
        },
        {
          "mine": true,
          "text": "no jasne, o której"
        },
        {
          "mine": false,
          "text": "20 u mnie"
        },
        {
          "mine": true,
          "text": "będę, biorę chipsy"
        }
      ]
    },
    {
      "name": "Malwina",
      "messages": [
        {
          "mine": true,
          "text": "masz ochotę na kino jutro"
        },
        {
          "mine": false,
          "text": "chętnie, co chcesz zobaczyć"
        },
        {
          "mine": true,
          "text": "ten nowy film, wszyscy o nim gadają"
        },
        {
          "mine": false,
          "text": "spoko, rezerwuj bilety"
        }
      ]
    },
    {
      "name": "Dawid",
      "messages": [
        {
          "mine": false,
          "text": "będziesz na weselu Kaśki"
        },
        {
          "mine": true,
          "text": "no pewnie, nie odpuszczę"
        },
        {
          "mine": false,
          "text": "super to się zobaczymy"
        },
        {
          "mine": true,
          "text": "dawno cię nie widziałem"
        }
      ]
    },
    {
      "name": "Karol",
      "messages": [
        {
          "mine": true,
          "text": "stary pomożesz mi przenieść szafę"
        },
        {
          "mine": false,
          "text": "kiedy"
        },
        {
          "mine": true,
          "text": "w niedzielę rano"
        },
        {
          "mine": false,
          "text": "dobra ale potem stawiasz piwo"
        },
        {
          "mine": true,
          "text": "umowa stoi"
        }
      ]
    },
    {
      "name": "Beata",
      "messages": [
        {
          "mine": false,
          "text": "gdzie kupiłaś te buty"
        },
        {
          "mine": true,
          "text": "w tym sklepie w galerii"
        },
        {
          "mine": false,
          "text": "muszę takie mieć"
        },
        {
          "mine": true,
          "text": "haha idź szybko bo się kończą"
        }
      ]
    },
    {
      "name": "Mikołaj",
      "messages": [
        {
          "mine": true,
          "text": "co tam u ciebie"
        },
        {
          "mine": false,
          "text": "wszystko po staremu"
        },
        {
          "mine": true,
          "text": "widziałem że zmieniłeś pracę"
        },
        {
          "mine": false,
          "text": "no na razie się wdrażam"
        },
        {
          "mine": true,
          "text": "trzymam kciuki"
        }
      ]
    },
    {
      "name": "Renata",
      "messages": [
        {
          "mine": false,
          "text": "przywieziesz coś ze sklepu?"
        },
        {
          "mine": true,
          "text": "jasne, mów co"
        },
        {
          "mine": false,
          "text": "masło i jajka"
        },
        {
          "mine": true,
          "text": "ok jadę"
        }
      ]
    },
    {
      "name": "Jacek",
      "messages": [
        {
          "mine": true,
          "text": "widziałeś wynik meczu?"
        },
        {
          "mine": false,
          "text": "no dramat, jak zawsze przegrali"
        },
        {
          "mine": true,
          "text": "męczą mnie już totalnie"
        },
        {
          "mine": false,
          "text": "a i tak będziemy oglądać xd"
        }
      ]
    },
    {
      "name": "Marcin gym",
      "messages": [
        {
          "mine": false,
          "text": "zmieniamy plan treningowy?"
        },
        {
          "mine": true,
          "text": "no przydałoby się, ten się przejadł"
        },
        {
          "mine": false,
          "text": "ogarnę nowy na weekend"
        },
        {
          "mine": true,
          "text": "spoko, dzięki"
        }
      ]
    },
    {
      "name": "Oliwia",
      "messages": [
        {
          "mine": true,
          "text": "tęskniłam za tobą, kiedy wracasz"
        },
        {
          "mine": false,
          "text": "w piątek wieczorem"
        },
        {
          "mine": true,
          "text": "nie mogę się doczekać"
        },
        {
          "mine": false,
          "text": "ja też, mam dla ciebie niespodziankę"
        },
        {
          "mine": true,
          "text": "co takiego?!"
        },
        {
          "mine": false,
          "text": "haha zobaczysz"
        }
      ]
    }
  ],
  "ru": [
    {
      "name": "Настя",
      "messages": [
        {
          "mine": false,
          "text": "ты где"
        },
        {
          "mine": true,
          "text": "ща выхожу, минут 10"
        },
        {
          "mine": false,
          "text": "опять проспал да"
        },
        {
          "mine": true,
          "text": "неа просто кофе делал"
        },
        {
          "mine": false,
          "text": "ага конечно"
        },
        {
          "mine": true,
          "text": "хаха ну ладно проспал немного"
        }
      ]
    },
    {
      "name": "Дима",
      "messages": [
        {
          "mine": true,
          "text": "чё делаешь"
        },
        {
          "mine": false,
          "text": "ничё, лежу"
        },
        {
          "mine": true,
          "text": "пошли гулять?"
        },
        {
          "mine": false,
          "text": "не, дождь же"
        },
        {
          "mine": true,
          "text": "да норм там уже"
        },
        {
          "mine": false,
          "text": "лан попозже напишу"
        }
      ]
    },
    {
      "name": "Катя ❤️",
      "messages": [
        {
          "mine": false,
          "text": "скучаю"
        },
        {
          "mine": true,
          "text": "и я 🥺"
        },
        {
          "mine": false,
          "text": "когда приедешь"
        },
        {
          "mine": true,
          "text": "в пятницу вечером, если пробок не будет"
        },
        {
          "mine": false,
          "text": "жду жду жду"
        },
        {
          "mine": true,
          "text": "куплю тебе твои печеньки"
        },
        {
          "mine": false,
          "text": "вот за это люблю ❤️"
        }
      ]
    },
    {
      "name": "Макс работа",
      "messages": [
        {
          "mine": false,
          "text": "ты отчёт скинул?"
        },
        {
          "mine": true,
          "text": "ща, дай пять минут"
        },
        {
          "mine": false,
          "text": "шеф уже спрашивал"
        },
        {
          "mine": true,
          "text": "блин. отправил, глянь почту"
        },
        {
          "mine": false,
          "text": "ок вижу спс"
        }
      ]
    },
    {
      "name": "Лёша",
      "messages": [
        {
          "mine": true,
          "text": "ты видел что вчера было"
        },
        {
          "mine": false,
          "text": "не, чё"
        },
        {
          "mine": true,
          "text": "да там такое, при встрече расскажу"
        },
        {
          "mine": false,
          "text": "ну вот всегда так"
        },
        {
          "mine": true,
          "text": "хаха завтра увидимся расскажу"
        }
      ]
    },
    {
      "name": "Оля",
      "messages": [
        {
          "mine": false,
          "text": "придёшь вечером?"
        },
        {
          "mine": true,
          "text": "куда"
        },
        {
          "mine": false,
          "text": "ну к Ане же, я вчера писала"
        },
        {
          "mine": true,
          "text": "а точно, забыл совсем"
        },
        {
          "mine": false,
          "text": "ну ты даёшь"
        },
        {
          "mine": true,
          "text": "приду приду, во сколько"
        },
        {
          "mine": false,
          "text": "к восьми"
        }
      ]
    },
    {
      "name": "Мама",
      "messages": [
        {
          "mine": false,
          "text": "поел?"
        },
        {
          "mine": true,
          "text": "да мам, всё нормально"
        },
        {
          "mine": false,
          "text": "суп в холодильнике, разогрей"
        },
        {
          "mine": true,
          "text": "хорошо, спасибо"
        },
        {
          "mine": false,
          "text": "позвони как время будет"
        },
        {
          "mine": true,
          "text": "вечером наберу"
        }
      ]
    },
    {
      "name": "Папа",
      "messages": [
        {
          "mine": true,
          "text": "пап ты дома?"
        },
        {
          "mine": false,
          "text": "да, а что"
        },
        {
          "mine": true,
          "text": "я ключи забыл кажется"
        },
        {
          "mine": false,
          "text": "эх. приходи, открою"
        },
        {
          "mine": true,
          "text": "спс, буду через полчаса"
        }
      ]
    },
    {
      "name": "Бабушка",
      "messages": [
        {
          "mine": false,
          "text": "внучок как ты там"
        },
        {
          "mine": true,
          "text": "всё хорошо ба, работаю"
        },
        {
          "mine": false,
          "text": "кушаешь нормально? худой был совсем"
        },
        {
          "mine": true,
          "text": "кушаю кушаю, не переживай"
        },
        {
          "mine": false,
          "text": "приезжай на выходных, пирожков напеку"
        },
        {
          "mine": true,
          "text": "постараюсь ❤️"
        }
      ]
    },
    {
      "name": "Дедушка",
      "messages": [
        {
          "mine": true,
          "text": "дед привет, как рыбалка"
        },
        {
          "mine": false,
          "text": "да не клюёт ничего сегодня"
        },
        {
          "mine": true,
          "text": "ну хоть погода норм?"
        },
        {
          "mine": false,
          "text": "погода хорошая, сижу отдыхаю"
        },
        {
          "mine": true,
          "text": "ну и правильно"
        }
      ]
    },
    {
      "name": "Аня универ",
      "messages": [
        {
          "mine": false,
          "text": "ты пару прогуливаешь?"
        },
        {
          "mine": true,
          "text": "неа сижу на задней парте, тут скукота"
        },
        {
          "mine": false,
          "text": "скинь потом конспект"
        },
        {
          "mine": true,
          "text": "ага, если сам не усну"
        },
        {
          "mine": false,
          "text": "хаха держись"
        }
      ]
    },
    {
      "name": "Игорь квартира",
      "messages": [
        {
          "mine": false,
          "text": "воду перекрыли, знал?"
        },
        {
          "mine": true,
          "text": "блин нет. до скольки"
        },
        {
          "mine": false,
          "text": "написали до 18"
        },
        {
          "mine": true,
          "text": "ну хоть чайник успел набрать"
        },
        {
          "mine": false,
          "text": "я нет 🥲"
        }
      ]
    },
    {
      "name": "Саша зал",
      "messages": [
        {
          "mine": true,
          "text": "идёшь сегодня?"
        },
        {
          "mine": false,
          "text": "да, к семи буду"
        },
        {
          "mine": true,
          "text": "ноги качаем?"
        },
        {
          "mine": false,
          "text": "ага, готовься страдать"
        },
        {
          "mine": true,
          "text": "ну спасибо конечно хаха"
        }
      ]
    },
    {
      "name": "солнышко",
      "messages": [
        {
          "mine": false,
          "text": "доброе утро 🌞"
        },
        {
          "mine": true,
          "text": "утро, как спалось"
        },
        {
          "mine": false,
          "text": "без тебя плохо"
        },
        {
          "mine": true,
          "text": "ну всё, растопил"
        },
        {
          "mine": false,
          "text": "вечером приходи, что-нибудь приготовлю"
        },
        {
          "mine": true,
          "text": "уже голодный, буду вовремя"
        }
      ]
    },
    {
      "name": "зайка",
      "messages": [
        {
          "mine": true,
          "text": "купить что-нибудь по дороге?"
        },
        {
          "mine": false,
          "text": "молоко и хлеб"
        },
        {
          "mine": false,
          "text": "и если будет вкусняшки"
        },
        {
          "mine": true,
          "text": "ясн, беру"
        },
        {
          "mine": false,
          "text": "ты лучший 🐰"
        }
      ]
    },
    {
      "name": "девочки",
      "messages": [
        {
          "mine": false,
          "text": "ну что, в субботу как договорились?"
        },
        {
          "mine": false,
          "text": "я за"
        },
        {
          "mine": true,
          "text": "я тоже, только не рано"
        },
        {
          "mine": false,
          "text": "к часу нормально?"
        },
        {
          "mine": true,
          "text": "ок"
        },
        {
          "mine": false,
          "text": "кто бронирует стол"
        },
        {
          "mine": true,
          "text": "давай я"
        }
      ]
    },
    {
      "name": "семья",
      "messages": [
        {
          "mine": false,
          "text": "все живы? давно не писали"
        },
        {
          "mine": true,
          "text": "живы, работаем"
        },
        {
          "mine": false,
          "text": "в воскресенье к бабушке едем, кто с нами"
        },
        {
          "mine": true,
          "text": "я с вами"
        },
        {
          "mine": false,
          "text": "отлично, выезжаем в 10"
        }
      ]
    },
    {
      "name": "футбол",
      "messages": [
        {
          "mine": false,
          "text": "сегодня собираемся?"
        },
        {
          "mine": true,
          "text": "да, поле забронил на 8"
        },
        {
          "mine": false,
          "text": "нас сколько"
        },
        {
          "mine": true,
          "text": "пока восемь, ещё двоих надо"
        },
        {
          "mine": false,
          "text": "я приведу брата"
        },
        {
          "mine": true,
          "text": "топ, тогда хватит"
        }
      ]
    },
    {
      "name": "квартира",
      "messages": [
        {
          "mine": false,
          "text": "кто посуду не помыл опять"
        },
        {
          "mine": true,
          "text": "не я, честно"
        },
        {
          "mine": false,
          "text": "ну а кто тогда"
        },
        {
          "mine": true,
          "text": "загадка века"
        },
        {
          "mine": false,
          "text": "хаха ладно вечером решим"
        }
      ]
    },
    {
      "name": "наши",
      "messages": [
        {
          "mine": true,
          "text": "го в выходные на дачу"
        },
        {
          "mine": false,
          "text": "я за, шашлык?"
        },
        {
          "mine": true,
          "text": "обязательно"
        },
        {
          "mine": false,
          "text": "мясо на ком"
        },
        {
          "mine": true,
          "text": "давай я возьму, скинемся потом"
        },
        {
          "mine": false,
          "text": "договорились"
        }
      ]
    },
    {
      "name": "Вика",
      "messages": [
        {
          "mine": false,
          "text": "видела твоё фото, огонь"
        },
        {
          "mine": true,
          "text": "да ладно, обычное"
        },
        {
          "mine": false,
          "text": "не скромничай"
        },
        {
          "mine": true,
          "text": "спс 😊"
        }
      ]
    },
    {
      "name": "Кирилл",
      "messages": [
        {
          "mine": true,
          "text": "ты доехал?"
        },
        {
          "mine": false,
          "text": "почти, стою в пробке"
        },
        {
          "mine": true,
          "text": "понял, ждём"
        },
        {
          "mine": false,
          "text": "начинайте без меня если что"
        },
        {
          "mine": true,
          "text": "да лан, подождём"
        }
      ]
    },
    {
      "name": "Женя",
      "messages": [
        {
          "mine": false,
          "text": "чё по планам на вечер"
        },
        {
          "mine": true,
          "text": "да никаких, дома валяюсь"
        },
        {
          "mine": false,
          "text": "погнали в кино"
        },
        {
          "mine": true,
          "text": "а что идёт"
        },
        {
          "mine": false,
          "text": "да найдём чё нить"
        },
        {
          "mine": true,
          "text": "лан уговорил"
        }
      ]
    },
    {
      "name": "Рома",
      "messages": [
        {
          "mine": true,
          "text": "вернёшь наушники?"
        },
        {
          "mine": false,
          "text": "а, точно, завтра принесу"
        },
        {
          "mine": true,
          "text": "ты это уже неделю говоришь"
        },
        {
          "mine": false,
          "text": "хаха всё завтра точно"
        }
      ]
    },
    {
      "name": "Тёма",
      "messages": [
        {
          "mine": false,
          "text": "го погоняем в приставку"
        },
        {
          "mine": true,
          "text": "ща не могу, дела"
        },
        {
          "mine": false,
          "text": "ну вечно у тебя дела"
        },
        {
          "mine": true,
          "text": "часа через два освобожусь"
        },
        {
          "mine": false,
          "text": "лан жду"
        }
      ]
    },
    {
      "name": "Полина",
      "messages": [
        {
          "mine": false,
          "text": "как экзамен?"
        },
        {
          "mine": true,
          "text": "вроде норм, четвёрка"
        },
        {
          "mine": false,
          "text": "о, красава"
        },
        {
          "mine": true,
          "text": "спс, теперь сплю два дня"
        },
        {
          "mine": false,
          "text": "заслужил хаха"
        }
      ]
    },
    {
      "name": "Никита",
      "messages": [
        {
          "mine": true,
          "text": "ты завтра работаешь?"
        },
        {
          "mine": false,
          "text": "да, с утра"
        },
        {
          "mine": true,
          "text": "эх, хотел позвать на озеро"
        },
        {
          "mine": false,
          "text": "в другой раз давай"
        },
        {
          "mine": true,
          "text": "ок замётано"
        }
      ]
    },
    {
      "name": "Соня",
      "messages": [
        {
          "mine": false,
          "text": "тыыы"
        },
        {
          "mine": false,
          "text": "я забыла зонт у тебя"
        },
        {
          "mine": true,
          "text": "ага висит на вешалке, вижу"
        },
        {
          "mine": false,
          "text": "заберу в среду"
        },
        {
          "mine": true,
          "text": "ок он никуда не денется"
        }
      ]
    },
    {
      "name": "Артём",
      "messages": [
        {
          "mine": true,
          "text": "скинь трек который вчера ставил"
        },
        {
          "mine": false,
          "text": "ща найду"
        },
        {
          "mine": false,
          "text": "держи, там в плейлисте вторая"
        },
        {
          "mine": true,
          "text": "о спс, весь день в голове"
        },
        {
          "mine": false,
          "text": "хаха теперь и у меня"
        }
      ]
    },
    {
      "name": "Юля",
      "messages": [
        {
          "mine": false,
          "text": "придёшь на др?"
        },
        {
          "mine": true,
          "text": "конечно, когда"
        },
        {
          "mine": false,
          "text": "в субботу, часам к шести"
        },
        {
          "mine": true,
          "text": "буду, что подарить намекни"
        },
        {
          "mine": false,
          "text": "просто приходи, остальное неважно"
        },
        {
          "mine": true,
          "text": "ну не, с пустыми руками не приду"
        }
      ]
    },
    {
      "name": "Ксюша",
      "messages": [
        {
          "mine": true,
          "text": "ты где пропала"
        },
        {
          "mine": false,
          "text": "да завал на работе полный"
        },
        {
          "mine": true,
          "text": "понимаю, давай на выхах кофе"
        },
        {
          "mine": false,
          "text": "да, очень надо выговориться"
        },
        {
          "mine": true,
          "text": "ну вот и повод"
        }
      ]
    },
    {
      "name": "Паша",
      "messages": [
        {
          "mine": false,
          "text": "машину помыл наконец"
        },
        {
          "mine": true,
          "text": "о, к дождю значит"
        },
        {
          "mine": false,
          "text": "не смешно хаха"
        },
        {
          "mine": true,
          "text": "да я серьёзно, гисметео глянь"
        },
        {
          "mine": false,
          "text": "блин и правда"
        }
      ]
    },
    {
      "name": "Марина",
      "messages": [
        {
          "mine": false,
          "text": "ты рецепт обещала"
        },
        {
          "mine": true,
          "text": "а точно, ща напишу"
        },
        {
          "mine": true,
          "text": "мука, яйца, немного сахара и терпение"
        },
        {
          "mine": false,
          "text": "с терпением проблемы хаха"
        },
        {
          "mine": true,
          "text": "тогда заказывай готовое"
        }
      ]
    },
    {
      "name": "Серёга",
      "messages": [
        {
          "mine": true,
          "text": "ты дома вечером?"
        },
        {
          "mine": false,
          "text": "да, заходи"
        },
        {
          "mine": true,
          "text": "пивка возьму, посидим"
        },
        {
          "mine": false,
          "text": "давай, я как раз освободился"
        },
        {
          "mine": true,
          "text": "через час буду"
        }
      ]
    },
    {
      "name": "Даша",
      "messages": [
        {
          "mine": false,
          "text": "ну как тебе новая работа"
        },
        {
          "mine": true,
          "text": "пока привыкаю, коллектив норм"
        },
        {
          "mine": false,
          "text": "это главное"
        },
        {
          "mine": true,
          "text": "да, дорога только долгая"
        },
        {
          "mine": false,
          "text": "ну потерпишь, зато интересно"
        }
      ]
    },
    {
      "name": "Влад",
      "messages": [
        {
          "mine": true,
          "text": "го в зал завтра"
        },
        {
          "mine": false,
          "text": "я ещё после прошлого не отошёл"
        },
        {
          "mine": true,
          "text": "хаха слабак"
        },
        {
          "mine": false,
          "text": "лан лан приду"
        }
      ]
    },
    {
      "name": "Лена",
      "messages": [
        {
          "mine": false,
          "text": "скинь фотки со вчера"
        },
        {
          "mine": true,
          "text": "ща разберу, там штук сто"
        },
        {
          "mine": false,
          "text": "давай все, потом выберу"
        },
        {
          "mine": true,
          "text": "ок кидаю альбом"
        },
        {
          "mine": false,
          "text": "спасибо ты чудо"
        }
      ]
    },
    {
      "name": "Гриша",
      "messages": [
        {
          "mine": true,
          "text": "ты сегодня за рулём?"
        },
        {
          "mine": false,
          "text": "да, подвезти?"
        },
        {
          "mine": true,
          "text": "если не сложно, до центра"
        },
        {
          "mine": false,
          "text": "без проблем, буду в семь"
        },
        {
          "mine": true,
          "text": "ты выручил, спс"
        }
      ]
    },
    {
      "name": "Таня",
      "messages": [
        {
          "mine": false,
          "text": "чем занята"
        },
        {
          "mine": true,
          "text": "убираюсь, достало всё"
        },
        {
          "mine": false,
          "text": "хаха знакомо"
        },
        {
          "mine": true,
          "text": "потом кофе выпьем?"
        },
        {
          "mine": false,
          "text": "давай, я за"
        }
      ]
    },
    {
      "name": "Костя",
      "messages": [
        {
          "mine": true,
          "text": "ты книгу дочитал?"
        },
        {
          "mine": false,
          "text": "неа, застрял на середине"
        },
        {
          "mine": true,
          "text": "дальше интереснее, не бросай"
        },
        {
          "mine": false,
          "text": "лан продолжу вечером"
        }
      ]
    },
    {
      "name": "Алина",
      "messages": [
        {
          "mine": false,
          "text": "ты не забыл про завтра?"
        },
        {
          "mine": true,
          "text": "нет конечно, во сколько встречаемся"
        },
        {
          "mine": false,
          "text": "в 11 у метро"
        },
        {
          "mine": true,
          "text": "ок буду вовремя"
        },
        {
          "mine": false,
          "text": "ну посмотрим хаха"
        }
      ]
    },
    {
      "name": "Егор",
      "messages": [
        {
          "mine": true,
          "text": "чё как жизнь"
        },
        {
          "mine": false,
          "text": "да норм, работаю сплю работаю"
        },
        {
          "mine": true,
          "text": "знакомая схема"
        },
        {
          "mine": false,
          "text": "надо развеяться, го куда нить"
        },
        {
          "mine": true,
          "text": "го, придумай куда"
        }
      ]
    },
    {
      "name": "Кристина",
      "messages": [
        {
          "mine": false,
          "text": "вот это платье или синее?"
        },
        {
          "mine": true,
          "text": "первое, точно"
        },
        {
          "mine": false,
          "text": "уверен?"
        },
        {
          "mine": true,
          "text": "на сто процентов"
        },
        {
          "mine": false,
          "text": "лан беру, спасибо"
        }
      ]
    },
    {
      "name": "Миша",
      "messages": [
        {
          "mine": true,
          "text": "ты видел счёт вчера?"
        },
        {
          "mine": false,
          "text": "да, ну это позор просто"
        },
        {
          "mine": true,
          "text": "вообще без слов"
        },
        {
          "mine": false,
          "text": "в следующий раз отыграются"
        },
        {
          "mine": true,
          "text": "каждый раз это говорим хаха"
        }
      ]
    },
    {
      "name": "Наташа",
      "messages": [
        {
          "mine": false,
          "text": "как долетела?"
        },
        {
          "mine": true,
          "text": "нормально, немного трясло"
        },
        {
          "mine": false,
          "text": "главное на месте"
        },
        {
          "mine": true,
          "text": "да, уже в отеле, красота тут"
        },
        {
          "mine": false,
          "text": "завидую, отдыхай"
        }
      ]
    },
    {
      "name": "Стас",
      "messages": [
        {
          "mine": true,
          "text": "го на велах в воскресенье"
        },
        {
          "mine": false,
          "text": "а у меня колесо спущено"
        },
        {
          "mine": true,
          "text": "подкачаем, делов то"
        },
        {
          "mine": false,
          "text": "лан, тогда с утра"
        }
      ]
    },
    {
      "name": "Вероника",
      "messages": [
        {
          "mine": false,
          "text": "скучный день такой"
        },
        {
          "mine": true,
          "text": "а ты выйди прогуляйся"
        },
        {
          "mine": false,
          "text": "лень"
        },
        {
          "mine": true,
          "text": "ну тогда терпи скуку хаха"
        },
        {
          "mine": false,
          "text": "жестокий ты"
        }
      ]
    },
    {
      "name": "Денис",
      "messages": [
        {
          "mine": true,
          "text": "занял мне место?"
        },
        {
          "mine": false,
          "text": "да, у окна"
        },
        {
          "mine": true,
          "text": "топ, уже подхожу"
        },
        {
          "mine": false,
          "text": "давай быстрее, начинается"
        }
      ]
    },
    {
      "name": "Ира",
      "messages": [
        {
          "mine": false,
          "text": "ну расскажи как свидание"
        },
        {
          "mine": true,
          "text": "да так себе, скучновато"
        },
        {
          "mine": false,
          "text": "эх, жаль"
        },
        {
          "mine": true,
          "text": "ну хоть кофе вкусный был"
        },
        {
          "mine": false,
          "text": "хаха хоть что то"
        }
      ]
    },
    {
      "name": "Толя",
      "messages": [
        {
          "mine": true,
          "text": "дрель дашь на выходные?"
        },
        {
          "mine": false,
          "text": "да бери, всё равно лежит"
        },
        {
          "mine": true,
          "text": "спс, заеду вечером"
        },
        {
          "mine": false,
          "text": "ок буду дома"
        }
      ]
    },
    {
      "name": "Света",
      "messages": [
        {
          "mine": false,
          "text": "ты завтракал вообще?"
        },
        {
          "mine": true,
          "text": "кофе выпил"
        },
        {
          "mine": false,
          "text": "это не завтрак"
        },
        {
          "mine": true,
          "text": "для меня да хаха"
        },
        {
          "mine": false,
          "text": "ну ты и тип"
        }
      ]
    },
    {
      "name": "Боря",
      "messages": [
        {
          "mine": true,
          "text": "на рыбалку в субботу?"
        },
        {
          "mine": false,
          "text": "о давно пора, во сколько"
        },
        {
          "mine": true,
          "text": "в пять утра выезд"
        },
        {
          "mine": false,
          "text": "жестко, но окей"
        },
        {
          "mine": true,
          "text": "червей я беру"
        }
      ]
    },
    {
      "name": "Люба",
      "messages": [
        {
          "mine": false,
          "text": "поздравь меня, права сдала!"
        },
        {
          "mine": true,
          "text": "ого поздравляю!!"
        },
        {
          "mine": false,
          "text": "с третьего раза но всё же"
        },
        {
          "mine": true,
          "text": "главное результат, красава"
        },
        {
          "mine": false,
          "text": "теперь боюсь ехать хаха"
        }
      ]
    },
    {
      "name": "Витя",
      "messages": [
        {
          "mine": true,
          "text": "ты код скинул на почту?"
        },
        {
          "mine": false,
          "text": "да, глянь папку"
        },
        {
          "mine": true,
          "text": "вижу, спс огромное"
        },
        {
          "mine": false,
          "text": "обращайся"
        }
      ]
    },
    {
      "name": "Галя",
      "messages": [
        {
          "mine": false,
          "text": "цветы полила?"
        },
        {
          "mine": true,
          "text": "ой забыл, ща"
        },
        {
          "mine": false,
          "text": "ну как всегда"
        },
        {
          "mine": true,
          "text": "всё, полил, довольна?"
        },
        {
          "mine": false,
          "text": "вот теперь да"
        }
      ]
    },
    {
      "name": "Федя",
      "messages": [
        {
          "mine": true,
          "text": "ты где вчера пропал"
        },
        {
          "mine": false,
          "text": "уснул, извини"
        },
        {
          "mine": true,
          "text": "хаха я так и понял"
        },
        {
          "mine": false,
          "text": "неделя тяжёлая была"
        },
        {
          "mine": true,
          "text": "да лан, бывает"
        }
      ]
    },
    {
      "name": "Зина",
      "messages": [
        {
          "mine": false,
          "text": "ну что решили с отпуском"
        },
        {
          "mine": true,
          "text": "пока думаем, море или горы"
        },
        {
          "mine": false,
          "text": "море конечно"
        },
        {
          "mine": true,
          "text": "вот и я так думаю"
        },
        {
          "mine": false,
          "text": "тогда бронируй скорее"
        }
      ]
    },
    {
      "name": "Гена",
      "messages": [
        {
          "mine": true,
          "text": "ты гараж открыл?"
        },
        {
          "mine": false,
          "text": "да, заезжай"
        },
        {
          "mine": true,
          "text": "ок через десять минут"
        },
        {
          "mine": false,
          "text": "жду, чай поставил"
        }
      ]
    },
    {
      "name": "Рита",
      "messages": [
        {
          "mine": false,
          "text": "я так устала сегодня"
        },
        {
          "mine": true,
          "text": "ложись пораньше"
        },
        {
          "mine": false,
          "text": "да не могу уснуть никак"
        },
        {
          "mine": true,
          "text": "чаю с мятой попей"
        },
        {
          "mine": false,
          "text": "попробую, спасибо"
        }
      ]
    },
    {
      "name": "Слава",
      "messages": [
        {
          "mine": true,
          "text": "билеты взял?"
        },
        {
          "mine": false,
          "text": "да, два, третий ряд"
        },
        {
          "mine": true,
          "text": "о отлично, скину деньги"
        },
        {
          "mine": false,
          "text": "да лан потом"
        },
        {
          "mine": true,
          "text": "не, ща переведу, а то забуду"
        }
      ]
    },
    {
      "name": "Инна",
      "messages": [
        {
          "mine": false,
          "text": "ты платье в химчистку сдал?"
        },
        {
          "mine": true,
          "text": "ага, в пятницу забирать"
        },
        {
          "mine": false,
          "text": "отлично, спасибо"
        },
        {
          "mine": true,
          "text": "квитанцию на холодильник повесил"
        }
      ]
    },
    {
      "name": "Коля",
      "messages": [
        {
          "mine": true,
          "text": "го обедать"
        },
        {
          "mine": false,
          "text": "я уже поел, извини"
        },
        {
          "mine": true,
          "text": "эх, один пойду"
        },
        {
          "mine": false,
          "text": "кофе потом составлю компанию"
        },
        {
          "mine": true,
          "text": "ну лан, идёт"
        }
      ]
    },
    {
      "name": "Люда",
      "messages": [
        {
          "mine": false,
          "text": "внуки замучили совсем хаха"
        },
        {
          "mine": true,
          "text": "зато весело"
        },
        {
          "mine": false,
          "text": "это да, шумные но родные"
        },
        {
          "mine": true,
          "text": "приезжай к нам отдохнуть"
        },
        {
          "mine": false,
          "text": "обязательно на неделе"
        }
      ]
    },
    {
      "name": "Андрей зал",
      "messages": [
        {
          "mine": true,
          "text": "жим сегодня?"
        },
        {
          "mine": false,
          "text": "да, спину добьём ещё"
        },
        {
          "mine": true,
          "text": "ну погнали, встречаемся в 19"
        },
        {
          "mine": false,
          "text": "на месте буду"
        }
      ]
    },
    {
      "name": "Маша универ",
      "messages": [
        {
          "mine": false,
          "text": "тебе прислали расписание?"
        },
        {
          "mine": true,
          "text": "да, первая в 9, ужас"
        },
        {
          "mine": false,
          "text": "кто вообще ставит в 9"
        },
        {
          "mine": true,
          "text": "вот и я о том же"
        },
        {
          "mine": false,
          "text": "будем спать по очереди хаха"
        }
      ]
    },
    {
      "name": "Тимур",
      "messages": [
        {
          "mine": true,
          "text": "ты подписался на курс?"
        },
        {
          "mine": false,
          "text": "да, начал первый урок"
        },
        {
          "mine": true,
          "text": "ну как?"
        },
        {
          "mine": false,
          "text": "сложновато но интересно"
        },
        {
          "mine": true,
          "text": "вместе будет легче, го созвон"
        }
      ]
    },
    {
      "name": "Регина",
      "messages": [
        {
          "mine": false,
          "text": "кофе или чай сегодня?"
        },
        {
          "mine": true,
          "text": "кофе, крепкий"
        },
        {
          "mine": false,
          "text": "поняла, тебе как обычно"
        },
        {
          "mine": true,
          "text": "ты золото"
        }
      ]
    },
    {
      "name": "Валера",
      "messages": [
        {
          "mine": true,
          "text": "ты на дачу когда"
        },
        {
          "mine": false,
          "text": "в пятницу вечером"
        },
        {
          "mine": true,
          "text": "захвати меня?"
        },
        {
          "mine": false,
          "text": "да без вопросов, только не опаздывай"
        },
        {
          "mine": true,
          "text": "буду как штык"
        }
      ]
    },
    {
      "name": "Эля",
      "messages": [
        {
          "mine": false,
          "text": "скинь свой адрес, посылку отправлю"
        },
        {
          "mine": true,
          "text": "давай лучше на пункт выдачи"
        },
        {
          "mine": false,
          "text": "а точно, так удобнее"
        },
        {
          "mine": true,
          "text": "ага, спасибо что помнишь"
        }
      ]
    },
    {
      "name": "Захар",
      "messages": [
        {
          "mine": true,
          "text": "ты доделал презентацию?"
        },
        {
          "mine": false,
          "text": "почти, пару слайдов осталось"
        },
        {
          "mine": true,
          "text": "скинь как будет, гляну"
        },
        {
          "mine": false,
          "text": "ок, минут через двадцать"
        }
      ]
    },
    {
      "name": "Оксана",
      "messages": [
        {
          "mine": false,
          "text": "как настроение"
        },
        {
          "mine": true,
          "text": "да так, серединка на половинку"
        },
        {
          "mine": false,
          "text": "что случилось"
        },
        {
          "mine": true,
          "text": "да ничего, просто устал"
        },
        {
          "mine": false,
          "text": "отдохни, всё наладится"
        }
      ]
    },
    {
      "name": "Лёва",
      "messages": [
        {
          "mine": true,
          "text": "го в кино на вечерний"
        },
        {
          "mine": false,
          "text": "на какой"
        },
        {
          "mine": true,
          "text": "да тот боевик новый"
        },
        {
          "mine": false,
          "text": "о давно хотел, беру билеты"
        },
        {
          "mine": true,
          "text": "топ"
        }
      ]
    },
    {
      "name": "Диана",
      "messages": [
        {
          "mine": false,
          "text": "ты видел какая луна вчера"
        },
        {
          "mine": true,
          "text": "неа, проспал всё веселье"
        },
        {
          "mine": false,
          "text": "эх, огромная была"
        },
        {
          "mine": true,
          "text": "скинешь фото?"
        },
        {
          "mine": false,
          "text": "держи, но вживую круче"
        }
      ]
    },
    {
      "name": "Руслан",
      "messages": [
        {
          "mine": true,
          "text": "ты на тренировку идёшь?"
        },
        {
          "mine": false,
          "text": "да, только форму найду"
        },
        {
          "mine": true,
          "text": "хаха опять посеял"
        },
        {
          "mine": false,
          "text": "нашёл, всё, выхожу"
        }
      ]
    },
    {
      "name": "Влада",
      "messages": [
        {
          "mine": false,
          "text": "помоги выбрать подарок маме"
        },
        {
          "mine": true,
          "text": "а что она любит"
        },
        {
          "mine": false,
          "text": "ну не знаю, цветы банально"
        },
        {
          "mine": true,
          "text": "давай что то для дома, уютное"
        },
        {
          "mine": false,
          "text": "о хорошая идея, спасибо"
        }
      ]
    },
    {
      "name": "Пётр",
      "messages": [
        {
          "mine": true,
          "text": "ты подъедешь на встречу?"
        },
        {
          "mine": false,
          "text": "да, минут через пятнадцать"
        },
        {
          "mine": true,
          "text": "ок ждём в кафе"
        },
        {
          "mine": false,
          "text": "закажите мне капучино"
        },
        {
          "mine": true,
          "text": "уже заказали"
        }
      ]
    },
    {
      "name": "Яна",
      "messages": [
        {
          "mine": false,
          "text": "ты чего грустный в чате"
        },
        {
          "mine": true,
          "text": "да нормально всё, показалось"
        },
        {
          "mine": false,
          "text": "ну смотри, если что пиши"
        },
        {
          "mine": true,
          "text": "спасибо, правда всё ок"
        }
      ]
    },
    {
      "name": "Антон",
      "messages": [
        {
          "mine": true,
          "text": "матч смотришь?"
        },
        {
          "mine": false,
          "text": "да, нервы не выдерживают"
        },
        {
          "mine": true,
          "text": "вот это игра, ужас"
        },
        {
          "mine": false,
          "text": "если проиграем я спать"
        },
        {
          "mine": true,
          "text": "хаха держись, ещё тайм"
        }
      ]
    },
    {
      "name": "Алёна",
      "messages": [
        {
          "mine": false,
          "text": "котик мой заболел кажется"
        },
        {
          "mine": true,
          "text": "ой что с ним"
        },
        {
          "mine": false,
          "text": "вялый и не ест"
        },
        {
          "mine": true,
          "text": "свози проверь на всякий"
        },
        {
          "mine": false,
          "text": "да, завтра поедем"
        }
      ]
    },
    {
      "name": "Матвей",
      "messages": [
        {
          "mine": true,
          "text": "ты гитару принёс?"
        },
        {
          "mine": false,
          "text": "ага, у меня в машине"
        },
        {
          "mine": true,
          "text": "о супер, вечером поиграем"
        },
        {
          "mine": false,
          "text": "давай, я новую песню разучил"
        }
      ]
    },
    {
      "name": "Карина",
      "messages": [
        {
          "mine": false,
          "text": "ну как тебе новая стрижка"
        },
        {
          "mine": true,
          "text": "очень идёт, честно"
        },
        {
          "mine": false,
          "text": "уф, а то переживала"
        },
        {
          "mine": true,
          "text": "зря, реально классно"
        },
        {
          "mine": false,
          "text": "спасибо ты добрый"
        }
      ]
    },
    {
      "name": "Глеб",
      "messages": [
        {
          "mine": true,
          "text": "ты на паре был?"
        },
        {
          "mine": false,
          "text": "неа, проспал"
        },
        {
          "mine": true,
          "text": "эх, там контрольную объявили"
        },
        {
          "mine": false,
          "text": "да ну, когда"
        },
        {
          "mine": true,
          "text": "в четверг, готовься"
        }
      ]
    },
    {
      "name": "Есения",
      "messages": [
        {
          "mine": false,
          "text": "ты придёшь на йогу?"
        },
        {
          "mine": true,
          "text": "попробую, спина болит после зала"
        },
        {
          "mine": false,
          "text": "вот как раз растянешься"
        },
        {
          "mine": true,
          "text": "лан уговорила"
        }
      ]
    },
    {
      "name": "Саня",
      "messages": [
        {
          "mine": true,
          "text": "ты где стоишь"
        },
        {
          "mine": false,
          "text": "у второго выхода"
        },
        {
          "mine": true,
          "text": "иду, не уходи"
        },
        {
          "mine": false,
          "text": "стою как памятник"
        },
        {
          "mine": true,
          "text": "хаха вижу тебя"
        }
      ]
    },
    {
      "name": "Нина",
      "messages": [
        {
          "mine": false,
          "text": "пирог удался, приезжай"
        },
        {
          "mine": true,
          "text": "ммм с чем"
        },
        {
          "mine": false,
          "text": "с яблоками, твой любимый"
        },
        {
          "mine": true,
          "text": "всё, еду, ставь чайник"
        },
        {
          "mine": false,
          "text": "уже ставлю"
        }
      ]
    },
    {
      "name": "Родион",
      "messages": [
        {
          "mine": true,
          "text": "комп починил?"
        },
        {
          "mine": false,
          "text": "да, пыль была виновата"
        },
        {
          "mine": true,
          "text": "о теперь не тормозит?"
        },
        {
          "mine": false,
          "text": "летает, как новый"
        },
        {
          "mine": true,
          "text": "красава, спасибо за совет"
        }
      ]
    },
    {
      "name": "Ульяна",
      "messages": [
        {
          "mine": false,
          "text": "ты дочитала до конца?"
        },
        {
          "mine": true,
          "text": "да, концовка вынесла"
        },
        {
          "mine": false,
          "text": "вот да, я плакала"
        },
        {
          "mine": true,
          "text": "надо обсудить обязательно"
        },
        {
          "mine": false,
          "text": "давай завтра за кофе"
        }
      ]
    },
    {
      "name": "Женёк",
      "messages": [
        {
          "mine": true,
          "text": "го вечером покатаемся"
        },
        {
          "mine": false,
          "text": "на чём"
        },
        {
          "mine": true,
          "text": "да просто по городу, музыку погромче"
        },
        {
          "mine": false,
          "text": "о это по мне, заезжай"
        }
      ]
    },
    {
      "name": "Милана",
      "messages": [
        {
          "mine": false,
          "text": "скинь тот мем пожалуйста"
        },
        {
          "mine": true,
          "text": "какой из тысячи хаха"
        },
        {
          "mine": false,
          "text": "ну про кота"
        },
        {
          "mine": true,
          "text": "а, держи"
        },
        {
          "mine": false,
          "text": "вот он, спасибо, ору"
        }
      ]
    },
    {
      "name": "Илья",
      "messages": [
        {
          "mine": true,
          "text": "ты на работе?"
        },
        {
          "mine": false,
          "text": "да, до шести"
        },
        {
          "mine": true,
          "text": "давай после пересечёмся"
        },
        {
          "mine": false,
          "text": "давай, наберу как выйду"
        }
      ]
    },
    {
      "name": "Варя",
      "messages": [
        {
          "mine": false,
          "text": "я испекла печенье, зайдёшь?"
        },
        {
          "mine": true,
          "text": "а как же, конечно"
        },
        {
          "mine": false,
          "text": "тогда к семи"
        },
        {
          "mine": true,
          "text": "буду, чай с меня"
        },
        {
          "mine": false,
          "text": "идёт"
        }
      ]
    },
    {
      "name": "Гоша",
      "messages": [
        {
          "mine": true,
          "text": "ты машину продал?"
        },
        {
          "mine": false,
          "text": "не, покупатель слился"
        },
        {
          "mine": true,
          "text": "эх, найдётся другой"
        },
        {
          "mine": false,
          "text": "надеюсь, надоело уже возиться"
        }
      ]
    },
    {
      "name": "Вета",
      "messages": [
        {
          "mine": false,
          "text": "ты какой сериал смотришь сейчас"
        },
        {
          "mine": true,
          "text": "да тот детектив, залип"
        },
        {
          "mine": false,
          "text": "о мне посоветуешь?"
        },
        {
          "mine": true,
          "text": "обязательно, только начни с первого"
        },
        {
          "mine": false,
          "text": "лан вечером включу"
        }
      ]
    },
    {
      "name": "Клава",
      "messages": [
        {
          "mine": true,
          "text": "ты варенье закрыла?"
        },
        {
          "mine": false,
          "text": "да, десять банок вышло"
        },
        {
          "mine": true,
          "text": "ого, поделишься?"
        },
        {
          "mine": false,
          "text": "конечно, заходи бери"
        },
        {
          "mine": true,
          "text": "спасибо, обожаю твоё"
        }
      ]
    },
    {
      "name": "Прохор",
      "messages": [
        {
          "mine": false,
          "text": "ты на шашлыки в воскресенье?"
        },
        {
          "mine": true,
          "text": "да, что взять с меня"
        },
        {
          "mine": false,
          "text": "мангал и уголь есть, бери напитки"
        },
        {
          "mine": true,
          "text": "понял, будет сделано"
        }
      ]
    },
    {
      "name": "Айгуль",
      "messages": [
        {
          "mine": false,
          "text": "ты выспался?"
        },
        {
          "mine": true,
          "text": "не особо, сосед всю ночь дрелил"
        },
        {
          "mine": false,
          "text": "ну сосед у тебя конечно"
        },
        {
          "mine": true,
          "text": "не то слово, терплю"
        },
        {
          "mine": false,
          "text": "держись, кофе в помощь"
        }
      ]
    },
    {
      "name": "Тимофей",
      "messages": [
        {
          "mine": true,
          "text": "ты сдал проект?"
        },
        {
          "mine": false,
          "text": "да, в последнюю минуту хаха"
        },
        {
          "mine": true,
          "text": "классика"
        },
        {
          "mine": false,
          "text": "зато приняли без правок"
        },
        {
          "mine": true,
          "text": "вот это удача"
        }
      ]
    },
    {
      "name": "Жанна",
      "messages": [
        {
          "mine": false,
          "text": "давай завтра на маникюр вместе"
        },
        {
          "mine": true,
          "text": "давай, во сколько запишемся"
        },
        {
          "mine": false,
          "text": "на двенадцать нормально?"
        },
        {
          "mine": true,
          "text": "да, потом кофе рядом"
        },
        {
          "mine": false,
          "text": "идеально"
        }
      ]
    },
    {
      "name": "работа",
      "messages": [
        {
          "mine": false,
          "text": "напоминаю, завтра планёрка в 10"
        },
        {
          "mine": true,
          "text": "понял"
        },
        {
          "mine": false,
          "text": "кто задерживается, предупредите"
        },
        {
          "mine": true,
          "text": "я вовремя буду"
        },
        {
          "mine": false,
          "text": "отлично, всем хорошего вечера"
        }
      ]
    },
    {
      "name": "дача",
      "messages": [
        {
          "mine": false,
          "text": "на выходных едем сажать"
        },
        {
          "mine": true,
          "text": "я привезу рассаду"
        },
        {
          "mine": false,
          "text": "супер, а я лопаты подготовлю"
        },
        {
          "mine": true,
          "text": "погоду обещают хорошую"
        },
        {
          "mine": false,
          "text": "вот и славно, выезжаем в субботу утром"
        }
      ]
    }
  ],
  "uk": [
    {
      "name": "Оля",
      "messages": [
        {
          "mine": false,
          "text": "ти де"
        },
        {
          "mine": true,
          "text": "вже майже, хвилин 10"
        },
        {
          "mine": false,
          "text": "ок я всередині за столиком біля вікна"
        },
        {
          "mine": true,
          "text": "проспав трохи, вибач"
        },
        {
          "mine": false,
          "text": "хаха знала"
        }
      ]
    },
    {
      "name": "Андрій",
      "messages": [
        {
          "mine": true,
          "text": "го сьогодні в зал?"
        },
        {
          "mine": false,
          "text": "не можу, спина болить"
        },
        {
          "mine": true,
          "text": "та ти щоразу шото вигадуєш"
        },
        {
          "mine": false,
          "text": "серйозно цього разу"
        },
        {
          "mine": true,
          "text": "ага"
        },
        {
          "mine": false,
          "text": "завтра точно"
        }
      ]
    },
    {
      "name": "Іра",
      "messages": [
        {
          "mine": false,
          "text": "боже я щойно бачила Влада в тому кафе"
        },
        {
          "mine": true,
          "text": "ну і?"
        },
        {
          "mine": false,
          "text": "він був не сам"
        },
        {
          "mine": true,
          "text": "стоп з ким"
        },
        {
          "mine": false,
          "text": "розкажу ввечері не по телефону"
        },
        {
          "mine": true,
          "text": "іро ти серйозно зара так робиш"
        }
      ]
    },
    {
      "name": "Макс",
      "messages": [
        {
          "mine": true,
          "text": "фільм ввечері?"
        },
        {
          "mine": false,
          "text": "давай"
        },
        {
          "mine": true,
          "text": "о котрій"
        },
        {
          "mine": false,
          "text": "після 8 норм?"
        },
        {
          "mine": true,
          "text": "ок беру квитки"
        }
      ]
    },
    {
      "name": "Настя",
      "messages": [
        {
          "mine": false,
          "text": "як пройшов екзамен"
        },
        {
          "mine": true,
          "text": "не питай"
        },
        {
          "mine": false,
          "text": "так погано?"
        },
        {
          "mine": true,
          "text": "думаю перездача буде"
        },
        {
          "mine": false,
          "text": "та ладно ти ж вчила"
        },
        {
          "mine": true,
          "text": "вчила не те шо треба хД"
        }
      ]
    },
    {
      "name": "Тарас",
      "messages": [
        {
          "mine": true,
          "text": "ти взяв зарядку?"
        },
        {
          "mine": false,
          "text": "яку"
        },
        {
          "mine": true,
          "text": "від ноута, я в тебе лишав"
        },
        {
          "mine": false,
          "text": "а, да десь тут валяється"
        },
        {
          "mine": true,
          "text": "занеси завтра плз"
        },
        {
          "mine": false,
          "text": "ок"
        }
      ]
    },
    {
      "name": "Діма",
      "messages": [
        {
          "mine": false,
          "text": "го на вихідних на озеро"
        },
        {
          "mine": true,
          "text": "хто ще їде"
        },
        {
          "mine": false,
          "text": "я, ти, можливо Катя з Ромою"
        },
        {
          "mine": true,
          "text": "погоду дивився?"
        },
        {
          "mine": false,
          "text": "обіцяють сонце"
        },
        {
          "mine": true,
          "text": "тоді я за"
        }
      ]
    },
    {
      "name": "Катя",
      "messages": [
        {
          "mine": true,
          "text": "купила ту сукню?"
        },
        {
          "mine": false,
          "text": "ні, задорого"
        },
        {
          "mine": false,
          "text": "але вона така гарна(("
        },
        {
          "mine": true,
          "text": "може на зп візьмеш"
        },
        {
          "mine": false,
          "text": "може"
        },
        {
          "mine": true,
          "text": "надішли фото ще раз"
        }
      ]
    },
    {
      "name": "Влад",
      "messages": [
        {
          "mine": false,
          "text": "здоров, ти вдома?"
        },
        {
          "mine": true,
          "text": "нє на роботі до 6"
        },
        {
          "mine": false,
          "text": "а ключі де"
        },
        {
          "mine": true,
          "text": "під килимком як завжди"
        },
        {
          "mine": false,
          "text": "оо точно дякую"
        }
      ]
    },
    {
      "name": "Юля",
      "messages": [
        {
          "mine": true,
          "text": "ти спиш?"
        },
        {
          "mine": false,
          "text": "вже майже"
        },
        {
          "mine": true,
          "text": "вибач просто хотіла сказати шо сумую"
        },
        {
          "mine": false,
          "text": "і я"
        },
        {
          "mine": false,
          "text": "спи давай, завтра поговоримо"
        },
        {
          "mine": true,
          "text": "добраніч ❤️"
        }
      ]
    },
    {
      "name": "Сергій",
      "messages": [
        {
          "mine": false,
          "text": "мяч взяв?"
        },
        {
          "mine": true,
          "text": "взяв"
        },
        {
          "mine": false,
          "text": "нас скільки сьогодні"
        },
        {
          "mine": true,
          "text": "здається 8, ще Костя під питанням"
        },
        {
          "mine": false,
          "text": "ок вистачить"
        }
      ]
    },
    {
      "name": "Марта",
      "messages": [
        {
          "mine": true,
          "text": "як тобі новий серіал"
        },
        {
          "mine": false,
          "text": "перша серія норм друга затягнута"
        },
        {
          "mine": true,
          "text": "досмотри до 4"
        },
        {
          "mine": false,
          "text": "постараюсь"
        },
        {
          "mine": true,
          "text": "далі буде вау"
        }
      ]
    },
    {
      "name": "Женя",
      "messages": [
        {
          "mine": false,
          "text": "ти обіцяв повернути книжку"
        },
        {
          "mine": true,
          "text": "точно, забув зовсім"
        },
        {
          "mine": false,
          "text": "хД"
        },
        {
          "mine": true,
          "text": "завтра принесу зуб даю"
        },
        {
          "mine": false,
          "text": "ага чула вже"
        }
      ]
    },
    {
      "name": "Оксана",
      "messages": [
        {
          "mine": true,
          "text": "шо готуєш на день народження"
        },
        {
          "mine": false,
          "text": "думаю про запіканку і салати"
        },
        {
          "mine": true,
          "text": "я тортик можу зробити"
        },
        {
          "mine": false,
          "text": "ооо було б супер"
        },
        {
          "mine": true,
          "text": "який крем любиш"
        },
        {
          "mine": false,
          "text": "будь який тільки не масляний"
        }
      ]
    },
    {
      "name": "Богдан",
      "messages": [
        {
          "mine": false,
          "text": "ти шо мовчиш вже тиждень"
        },
        {
          "mine": true,
          "text": "та закрутився повністю"
        },
        {
          "mine": false,
          "text": "розумію, сам такий"
        },
        {
          "mine": true,
          "text": "давай в суботу пиво"
        },
        {
          "mine": false,
          "text": "го"
        }
      ]
    },
    {
      "name": "Ліза",
      "messages": [
        {
          "mine": true,
          "text": "прийдеш завтра на пару?"
        },
        {
          "mine": false,
          "text": "а шо там"
        },
        {
          "mine": true,
          "text": "здається контрольна"
        },
        {
          "mine": false,
          "text": "оо тоді прийду мабуть"
        },
        {
          "mine": true,
          "text": "мабуть хД"
        }
      ]
    },
    {
      "name": "Артем",
      "messages": [
        {
          "mine": false,
          "text": "бро глянь шо надіслав"
        },
        {
          "mine": true,
          "text": "хаха звідки ти це береш"
        },
        {
          "mine": false,
          "text": "інтернет знає все"
        },
        {
          "mine": true,
          "text": "я плакав"
        }
      ]
    },
    {
      "name": "Даша",
      "messages": [
        {
          "mine": true,
          "text": "ти вже їла?"
        },
        {
          "mine": false,
          "text": "ще ні, а шо"
        },
        {
          "mine": true,
          "text": "може разом, я замовлю щось"
        },
        {
          "mine": false,
          "text": "давай тільки не суші знову"
        },
        {
          "mine": true,
          "text": "ок піцу тоді"
        },
        {
          "mine": false,
          "text": "во"
        }
      ]
    },
    {
      "name": "Назар",
      "messages": [
        {
          "mine": false,
          "text": "ти де зник"
        },
        {
          "mine": true,
          "text": "телефон сів"
        },
        {
          "mine": false,
          "text": "класика"
        },
        {
          "mine": true,
          "text": "вже на зарядці, шо хотів"
        },
        {
          "mine": false,
          "text": "та вже нічого, пізно"
        }
      ]
    },
    {
      "name": "Віка",
      "messages": [
        {
          "mine": true,
          "text": "як ти після вчорашнього"
        },
        {
          "mine": false,
          "text": "не згадуй"
        },
        {
          "mine": true,
          "text": "хахаха ти був топ"
        },
        {
          "mine": false,
          "text": "я нічого не памʼятаю чесно"
        },
        {
          "mine": true,
          "text": "оце найкраще"
        }
      ]
    },
    {
      "name": "Рома",
      "messages": [
        {
          "mine": false,
          "text": "го завтра ранкова пробіжка"
        },
        {
          "mine": true,
          "text": "о котрій"
        },
        {
          "mine": false,
          "text": "7"
        },
        {
          "mine": true,
          "text": "ти шо здурів, ну 8"
        },
        {
          "mine": false,
          "text": "ок 8, буду чекати"
        }
      ]
    },
    {
      "name": "Соня",
      "messages": [
        {
          "mine": true,
          "text": "мама питала коли приїдеш"
        },
        {
          "mine": false,
          "text": "думаю в неділю"
        },
        {
          "mine": true,
          "text": "візьми зарядку для телефона тата"
        },
        {
          "mine": false,
          "text": "яку"
        },
        {
          "mine": true,
          "text": "він знає, просто нагадай"
        },
        {
          "mine": false,
          "text": "ок"
        }
      ]
    },
    {
      "name": "Петро",
      "messages": [
        {
          "mine": false,
          "text": "машину полагодили?"
        },
        {
          "mine": true,
          "text": "ще стоїть, деталь чекаю"
        },
        {
          "mine": false,
          "text": "довго"
        },
        {
          "mine": true,
          "text": "ну а шо поробиш"
        },
        {
          "mine": false,
          "text": "як шо треба підкину"
        },
        {
          "mine": true,
          "text": "дяка"
        }
      ]
    },
    {
      "name": "Аліна",
      "messages": [
        {
          "mine": true,
          "text": "ти бачила скільки коштує зара оренда"
        },
        {
          "mine": false,
          "text": "не кажи, жах"
        },
        {
          "mine": true,
          "text": "може разом шукати"
        },
        {
          "mine": false,
          "text": "я за, давай складемо список"
        },
        {
          "mine": true,
          "text": "завтра сядемо"
        }
      ]
    },
    {
      "name": "Ярик",
      "messages": [
        {
          "mine": false,
          "text": "ти в грі ввечері?"
        },
        {
          "mine": true,
          "text": "можливо після 9"
        },
        {
          "mine": false,
          "text": "ок кличу як зайду"
        },
        {
          "mine": true,
          "text": "тільки без рейджу цього разу"
        },
        {
          "mine": false,
          "text": "я спокійний як удав хД"
        }
      ]
    },
    {
      "name": "Христина",
      "messages": [
        {
          "mine": true,
          "text": "як прогулянка з собакою, дощ?"
        },
        {
          "mine": false,
          "text": "накрапає трохи"
        },
        {
          "mine": true,
          "text": "візьми парасолю"
        },
        {
          "mine": false,
          "text": "та ладно, добіжимо"
        },
        {
          "mine": true,
          "text": "потім не скигли шо мокрий"
        }
      ]
    },
    {
      "name": "Толя",
      "messages": [
        {
          "mine": false,
          "text": "ти квитки взяв на концерт?"
        },
        {
          "mine": true,
          "text": "блін забув, ще є?"
        },
        {
          "mine": false,
          "text": "перевір швидко"
        },
        {
          "mine": true,
          "text": "фух є ще"
        },
        {
          "mine": false,
          "text": "бери два"
        },
        {
          "mine": true,
          "text": "вже"
        }
      ]
    },
    {
      "name": "Маша",
      "messages": [
        {
          "mine": true,
          "text": "шо подарувати Насті"
        },
        {
          "mine": false,
          "text": "вона хотіла навушники"
        },
        {
          "mine": true,
          "text": "о дякую, а які"
        },
        {
          "mine": false,
          "text": "бездротові, колір не важливий"
        },
        {
          "mine": true,
          "text": "ідеально"
        }
      ]
    },
    {
      "name": "Гриша",
      "messages": [
        {
          "mine": false,
          "text": "субота дача, їдеш?"
        },
        {
          "mine": true,
          "text": "а шо робити будем"
        },
        {
          "mine": false,
          "text": "шашлик, город трохи"
        },
        {
          "mine": true,
          "text": "город можна пропустити хД"
        },
        {
          "mine": false,
          "text": "ага мрій"
        }
      ]
    },
    {
      "name": "Уляна",
      "messages": [
        {
          "mine": true,
          "text": "ти дзвонила бабусі?"
        },
        {
          "mine": false,
          "text": "вчора, все ок в неї"
        },
        {
          "mine": true,
          "text": "добре, я переживала"
        },
        {
          "mine": false,
          "text": "вона питала про тебе"
        },
        {
          "mine": true,
          "text": "передзвоню на вихідних"
        }
      ]
    },
    {
      "name": "Аня універ",
      "messages": [
        {
          "mine": false,
          "text": "конспект з соціології є?"
        },
        {
          "mine": true,
          "text": "є, скину фото"
        },
        {
          "mine": false,
          "text": "ти рятівниця"
        },
        {
          "mine": true,
          "text": "з тебе кава"
        },
        {
          "mine": false,
          "text": "домовились"
        }
      ]
    },
    {
      "name": "Ігор хата",
      "messages": [
        {
          "mine": true,
          "text": "хто мив посуд вчора нихто"
        },
        {
          "mine": false,
          "text": "не я)"
        },
        {
          "mine": true,
          "text": "класика"
        },
        {
          "mine": false,
          "text": "помию сьогодні, обіцяю"
        },
        {
          "mine": true,
          "text": "записую"
        }
      ]
    },
    {
      "name": "Макс робота",
      "messages": [
        {
          "mine": false,
          "text": "ти на обід ідеш?"
        },
        {
          "mine": true,
          "text": "через 10 хв"
        },
        {
          "mine": false,
          "text": "чекаю біля ліфта"
        },
        {
          "mine": true,
          "text": "ок, шеф ще тут?"
        },
        {
          "mine": false,
          "text": "вийшов на зустріч, вільно"
        }
      ]
    },
    {
      "name": "Саша зал",
      "messages": [
        {
          "mine": true,
          "text": "ти сьогодні на тренування?"
        },
        {
          "mine": false,
          "text": "да, ноги"
        },
        {
          "mine": true,
          "text": "оо приєднаюсь"
        },
        {
          "mine": false,
          "text": "приходь на 7"
        },
        {
          "mine": true,
          "text": "буду"
        }
      ]
    },
    {
      "name": "Ліна універ",
      "messages": [
        {
          "mine": false,
          "text": "здала курсач?"
        },
        {
          "mine": true,
          "text": "вночі дописала ледь"
        },
        {
          "mine": false,
          "text": "ти жесть"
        },
        {
          "mine": true,
          "text": "більше ніколи"
        },
        {
          "mine": false,
          "text": "ти це щосеместру кажеш хД"
        }
      ]
    },
    {
      "name": "Вова сусід",
      "messages": [
        {
          "mine": true,
          "text": "у тебе вода є? в мене відключили"
        },
        {
          "mine": false,
          "text": "є, заходь набери"
        },
        {
          "mine": true,
          "text": "дякую сусіде"
        },
        {
          "mine": false,
          "text": "та без проблем"
        }
      ]
    },
    {
      "name": "Юра робота",
      "messages": [
        {
          "mine": false,
          "text": "звіт скинув на пошту"
        },
        {
          "mine": true,
          "text": "бачу дякую"
        },
        {
          "mine": false,
          "text": "там в кінці ще подивись"
        },
        {
          "mine": true,
          "text": "ок гляну після мітингу"
        }
      ]
    },
    {
      "name": "Оля зал",
      "messages": [
        {
          "mine": true,
          "text": "абонемент продовжила?"
        },
        {
          "mine": false,
          "text": "ще ні, до пʼятниці треба"
        },
        {
          "mine": true,
          "text": "разом підемо продовжимо"
        },
        {
          "mine": false,
          "text": "давай, там знижка була"
        },
        {
          "mine": true,
          "text": "во точно"
        }
      ]
    },
    {
      "name": "Денис хата",
      "messages": [
        {
          "mine": false,
          "text": "хто платив за інтернет цей місяць"
        },
        {
          "mine": true,
          "text": "я, скинь свою частину"
        },
        {
          "mine": false,
          "text": "скільки"
        },
        {
          "mine": true,
          "text": "як завжди"
        },
        {
          "mine": false,
          "text": "ок зара"
        }
      ]
    },
    {
      "name": "Іванка танці",
      "messages": [
        {
          "mine": true,
          "text": "репетиція перенеслась на завтра"
        },
        {
          "mine": false,
          "text": "о котрій тепер"
        },
        {
          "mine": true,
          "text": "на 6 вечора"
        },
        {
          "mine": false,
          "text": "встигну після роботи"
        },
        {
          "mine": true,
          "text": "супер, не спізнюйся тільки"
        }
      ]
    },
    {
      "name": "сонечко",
      "messages": [
        {
          "mine": false,
          "text": "шо на вечерю хочеш"
        },
        {
          "mine": true,
          "text": "мені все одно, головне з тобою"
        },
        {
          "mine": false,
          "text": "яка ти солодка"
        },
        {
          "mine": true,
          "text": "то шо готуєш"
        },
        {
          "mine": false,
          "text": "паста, як любиш"
        },
        {
          "mine": true,
          "text": "❤️"
        }
      ]
    },
    {
      "name": "котику",
      "messages": [
        {
          "mine": true,
          "text": "ти вже їдеш?"
        },
        {
          "mine": false,
          "text": "виходжу зара"
        },
        {
          "mine": true,
          "text": "я скучила"
        },
        {
          "mine": false,
          "text": "5 хвилин і буду"
        },
        {
          "mine": true,
          "text": "чекаю"
        }
      ]
    },
    {
      "name": "Оля ❤️",
      "messages": [
        {
          "mine": false,
          "text": "доброго ранку красивий"
        },
        {
          "mine": true,
          "text": "доброго, як спалось"
        },
        {
          "mine": false,
          "text": "снилось шось хороше"
        },
        {
          "mine": true,
          "text": "я снився?"
        },
        {
          "mine": false,
          "text": "може бути хД"
        }
      ]
    },
    {
      "name": "зайчик",
      "messages": [
        {
          "mine": true,
          "text": "купи молоко по дорозі плз"
        },
        {
          "mine": false,
          "text": "ок ще шось"
        },
        {
          "mine": true,
          "text": "і хліб"
        },
        {
          "mine": false,
          "text": "записав"
        },
        {
          "mine": true,
          "text": "дякую любий"
        }
      ]
    },
    {
      "name": "любий",
      "messages": [
        {
          "mine": false,
          "text": "затримаюсь на роботі трохи"
        },
        {
          "mine": true,
          "text": "надовго?"
        },
        {
          "mine": false,
          "text": "на годинку"
        },
        {
          "mine": true,
          "text": "ок вечеря чекатиме"
        },
        {
          "mine": false,
          "text": "ти найкраща"
        }
      ]
    },
    {
      "name": "Марʼяна ❤️",
      "messages": [
        {
          "mine": true,
          "text": "подивимось шось ввечері?"
        },
        {
          "mine": false,
          "text": "давай, ти обирай"
        },
        {
          "mine": true,
          "text": "знову я?"
        },
        {
          "mine": false,
          "text": "у тебе смак кращий хД"
        },
        {
          "mine": true,
          "text": "лестиш"
        }
      ]
    },
    {
      "name": "Мама",
      "messages": [
        {
          "mine": false,
          "text": "поїв?"
        },
        {
          "mine": true,
          "text": "да мам"
        },
        {
          "mine": false,
          "text": "шо саме"
        },
        {
          "mine": true,
          "text": "суп, не хвилюйся"
        },
        {
          "mine": false,
          "text": "молодець, тепло одягайся завтра"
        },
        {
          "mine": true,
          "text": "добре"
        }
      ]
    },
    {
      "name": "Тато",
      "messages": [
        {
          "mine": true,
          "text": "тат ти вдома в суботу?"
        },
        {
          "mine": false,
          "text": "буду, а шо"
        },
        {
          "mine": true,
          "text": "хотів заїхати"
        },
        {
          "mine": false,
          "text": "приїжджай, гараж поможеш"
        },
        {
          "mine": true,
          "text": "ну звісно хД"
        }
      ]
    },
    {
      "name": "Бабуся",
      "messages": [
        {
          "mine": false,
          "text": "внучок як ти там"
        },
        {
          "mine": true,
          "text": "все добре бабусю, а ти як"
        },
        {
          "mine": false,
          "text": "поволі, город полю"
        },
        {
          "mine": true,
          "text": "не перевтомлюйся"
        },
        {
          "mine": false,
          "text": "приїжджай, вареники зроблю"
        },
        {
          "mine": true,
          "text": "обовʼязково приїду"
        }
      ]
    },
    {
      "name": "Дідусь",
      "messages": [
        {
          "mine": true,
          "text": "діду телевізор знов не працює?"
        },
        {
          "mine": false,
          "text": "показує але звуку нема"
        },
        {
          "mine": true,
          "text": "кнопку mute натисни на пульті"
        },
        {
          "mine": false,
          "text": "яку"
        },
        {
          "mine": true,
          "text": "приїду покажу в неділю"
        }
      ]
    },
    {
      "name": "Баба Ліда",
      "messages": [
        {
          "mine": false,
          "text": "ти шарф той носиш шо звʼязала"
        },
        {
          "mine": true,
          "text": "ношу бабо, дуже теплий"
        },
        {
          "mine": false,
          "text": "от і добре"
        },
        {
          "mine": true,
          "text": "усі питають де взяв хД"
        },
        {
          "mine": false,
          "text": "ай ну тебе"
        }
      ]
    },
    {
      "name": "Дід Коля",
      "messages": [
        {
          "mine": true,
          "text": "діду як рибалка"
        },
        {
          "mine": false,
          "text": "три щуки взяв"
        },
        {
          "mine": true,
          "text": "оо ти майстер"
        },
        {
          "mine": false,
          "text": "приїжджай юшку зваримо"
        },
        {
          "mine": true,
          "text": "їду в неділю"
        }
      ]
    },
    {
      "name": "хата",
      "messages": [
        {
          "mine": false,
          "text": "хто взяв мою каструлю"
        },
        {
          "mine": true,
          "text": "не я"
        },
        {
          "mine": false,
          "text": "вона зникла з кухні"
        },
        {
          "mine": true,
          "text": "може в посудомийці глянь"
        },
        {
          "mine": false,
          "text": "оо точно, сорі"
        },
        {
          "mine": true,
          "text": "хД"
        }
      ]
    },
    {
      "name": "сімʼя",
      "messages": [
        {
          "mine": false,
          "text": "нагадую в неділю обід у бабусі"
        },
        {
          "mine": true,
          "text": "о котрій"
        },
        {
          "mine": false,
          "text": "на 2, не спізнюйтесь"
        },
        {
          "mine": true,
          "text": "я буду"
        },
        {
          "mine": false,
          "text": "я торт візьму"
        }
      ]
    },
    {
      "name": "дівчата",
      "messages": [
        {
          "mine": true,
          "text": "дівчата коли зустрічаємось"
        },
        {
          "mine": false,
          "text": "пʼятниця вечір?"
        },
        {
          "mine": false,
          "text": "я за"
        },
        {
          "mine": true,
          "text": "де"
        },
        {
          "mine": false,
          "text": "те кафе на розі, там смачно"
        },
        {
          "mine": true,
          "text": "ок бронюю столик"
        }
      ]
    },
    {
      "name": "футбол",
      "messages": [
        {
          "mine": false,
          "text": "завтра о 8 як завжди?"
        },
        {
          "mine": true,
          "text": "я буду"
        },
        {
          "mine": false,
          "text": "нас скільки"
        },
        {
          "mine": true,
          "text": "я порахував 9, ще одного треба"
        },
        {
          "mine": false,
          "text": "покличу брата"
        },
        {
          "mine": true,
          "text": "во"
        }
      ]
    },
    {
      "name": "наші",
      "messages": [
        {
          "mine": true,
          "text": "хто на шашлик в суботу"
        },
        {
          "mine": false,
          "text": "я"
        },
        {
          "mine": false,
          "text": "ми з Танею теж"
        },
        {
          "mine": true,
          "text": "мʼясо на скільки брати"
        },
        {
          "mine": false,
          "text": "скинемось потім, бери на всіх"
        }
      ]
    },
    {
      "name": "універ",
      "messages": [
        {
          "mine": false,
          "text": "пара перенеслась в 305 аудиторію"
        },
        {
          "mine": true,
          "text": "дякую бо я вже до старої йшов"
        },
        {
          "mine": false,
          "text": "хД я теж мало не зайшов"
        },
        {
          "mine": true,
          "text": "хто взагалі це вирішив"
        },
        {
          "mine": false,
          "text": "деканат мабуть"
        }
      ]
    },
    {
      "name": "зал",
      "messages": [
        {
          "mine": true,
          "text": "хто йде вечором"
        },
        {
          "mine": false,
          "text": "я о 7"
        },
        {
          "mine": false,
          "text": "і я підтягнусь"
        },
        {
          "mine": true,
          "text": "тоді груди тренуємо"
        },
        {
          "mine": false,
          "text": "давай"
        }
      ]
    },
    {
      "name": "дача",
      "messages": [
        {
          "mine": false,
          "text": "хто полив помідори"
        },
        {
          "mine": true,
          "text": "я вчора"
        },
        {
          "mine": false,
          "text": "молодець"
        },
        {
          "mine": true,
          "text": "огірки вже майже готові"
        },
        {
          "mine": false,
          "text": "на вихідних приїдемо зберемо"
        }
      ]
    },
    {
      "name": "Микита",
      "messages": [
        {
          "mine": true,
          "text": "ти зарядку від айфона знайшов?"
        },
        {
          "mine": false,
          "text": "нє, думав в тебе"
        },
        {
          "mine": true,
          "text": "нема"
        },
        {
          "mine": false,
          "text": "ну класика ми обидва без"
        },
        {
          "mine": true,
          "text": "хД купимо одну на двох"
        }
      ]
    },
    {
      "name": "Аня",
      "messages": [
        {
          "mine": false,
          "text": "як побачення вчора"
        },
        {
          "mine": true,
          "text": "нормально але без іскри"
        },
        {
          "mine": false,
          "text": "оо жаль"
        },
        {
          "mine": true,
          "text": "та він норм просто не моє"
        },
        {
          "mine": false,
          "text": "ще знайдеш свого"
        }
      ]
    },
    {
      "name": "Стас",
      "messages": [
        {
          "mine": true,
          "text": "го в кіно на новий"
        },
        {
          "mine": false,
          "text": "кажуть слабкий"
        },
        {
          "mine": true,
          "text": "та все одно"
        },
        {
          "mine": false,
          "text": "ну ок, попкорн з тебе"
        },
        {
          "mine": true,
          "text": "домовились"
        }
      ]
    },
    {
      "name": "Люда",
      "messages": [
        {
          "mine": false,
          "text": "ти взяла парасолю? дощ"
        },
        {
          "mine": true,
          "text": "нє, під дощем біжу"
        },
        {
          "mine": false,
          "text": "ну ти даєш"
        },
        {
          "mine": true,
          "text": "вже майже вдома"
        },
        {
          "mine": false,
          "text": "чай зроби гарячий"
        }
      ]
    },
    {
      "name": "Вітя",
      "messages": [
        {
          "mine": true,
          "text": "позичиш дриль на вихідні"
        },
        {
          "mine": false,
          "text": "бери, він в гаражі"
        },
        {
          "mine": true,
          "text": "дякую верну в понеділок"
        },
        {
          "mine": false,
          "text": "тільки не загуби біти знову"
        },
        {
          "mine": true,
          "text": "то раз було хД"
        }
      ]
    },
    {
      "name": "Ната",
      "messages": [
        {
          "mine": false,
          "text": "де ти пропала"
        },
        {
          "mine": true,
          "text": "робота зʼїла повністю"
        },
        {
          "mine": false,
          "text": "давай хоч каву на тижні"
        },
        {
          "mine": true,
          "text": "давай, четвер?"
        },
        {
          "mine": false,
          "text": "ідеально"
        }
      ]
    },
    {
      "name": "Костя",
      "messages": [
        {
          "mine": true,
          "text": "ти на трену прийдеш?"
        },
        {
          "mine": false,
          "text": "коліно болить, пропущу"
        },
        {
          "mine": true,
          "text": "лікуйся"
        },
        {
          "mine": false,
          "text": "наступного тижня точно"
        },
        {
          "mine": true,
          "text": "ага, вже не вперше чую"
        }
      ]
    },
    {
      "name": "Галя",
      "messages": [
        {
          "mine": false,
          "text": "рецепт того пирога скинеш"
        },
        {
          "mine": true,
          "text": "зара сфоткаю з зошита"
        },
        {
          "mine": false,
          "text": "дякую, гості на вихідних"
        },
        {
          "mine": true,
          "text": "там головне яблука кислі бери"
        },
        {
          "mine": false,
          "text": "поняла"
        }
      ]
    },
    {
      "name": "Льоша",
      "messages": [
        {
          "mine": true,
          "text": "ти де паркуєшся зазвичай"
        },
        {
          "mine": false,
          "text": "за домом є місце"
        },
        {
          "mine": true,
          "text": "а зара вільно?"
        },
        {
          "mine": false,
          "text": "було одне коли виїжджав"
        },
        {
          "mine": true,
          "text": "ок їду пробувати"
        }
      ]
    },
    {
      "name": "Інна",
      "messages": [
        {
          "mine": false,
          "text": "ти дивилась той серіал шо радила"
        },
        {
          "mine": true,
          "text": "почала, затягує"
        },
        {
          "mine": false,
          "text": "правда ж"
        },
        {
          "mine": true,
          "text": "вже 3 серії за вечір"
        },
        {
          "mine": false,
          "text": "хД я так само була"
        }
      ]
    },
    {
      "name": "Пашка",
      "messages": [
        {
          "mine": true,
          "text": "бро вечором вільний?"
        },
        {
          "mine": false,
          "text": "після 7"
        },
        {
          "mine": true,
          "text": "го пиво і футбол"
        },
        {
          "mine": false,
          "text": "де дивимось"
        },
        {
          "mine": true,
          "text": "у мене, бери чіпси"
        },
        {
          "mine": false,
          "text": "їду"
        }
      ]
    },
    {
      "name": "Оленка",
      "messages": [
        {
          "mine": false,
          "text": "ти вже на вокзалі?"
        },
        {
          "mine": true,
          "text": "майже, таксі стоїть в заторі"
        },
        {
          "mine": false,
          "text": "поїзд о котрій"
        },
        {
          "mine": true,
          "text": "ще 40 хвилин, встигну"
        },
        {
          "mine": false,
          "text": "напиши як сядеш"
        },
        {
          "mine": true,
          "text": "ок"
        }
      ]
    },
    {
      "name": "Славік",
      "messages": [
        {
          "mine": true,
          "text": "гру вчора бачив?"
        },
        {
          "mine": false,
          "text": "жах а не гра"
        },
        {
          "mine": true,
          "text": "той пенальті це кошмар"
        },
        {
          "mine": false,
          "text": "не нагадуй"
        },
        {
          "mine": true,
          "text": "хД"
        }
      ]
    },
    {
      "name": "Даринка",
      "messages": [
        {
          "mine": false,
          "text": "малюнок закінчила?"
        },
        {
          "mine": true,
          "text": "майже, тінь докладаю"
        },
        {
          "mine": false,
          "text": "покажи як буде готово"
        },
        {
          "mine": true,
          "text": "обовʼязково"
        },
        {
          "mine": false,
          "text": "ти талант чесно"
        }
      ]
    },
    {
      "name": "Тимур",
      "messages": [
        {
          "mine": true,
          "text": "ти взяв квитки на потяг?"
        },
        {
          "mine": false,
          "text": "взяв, нижні полиці"
        },
        {
          "mine": true,
          "text": "красава"
        },
        {
          "mine": false,
          "text": "виїзд о 9 ранку не проспи"
        },
        {
          "mine": true,
          "text": "поставлю три будильники"
        }
      ]
    },
    {
      "name": "Зоряна",
      "messages": [
        {
          "mine": false,
          "text": "чути тебе давно не було"
        },
        {
          "mine": true,
          "text": "переїзд, коробки досі не розібрала"
        },
        {
          "mine": false,
          "text": "поможу як хочеш"
        },
        {
          "mine": true,
          "text": "приходь в суботу, буде весело"
        },
        {
          "mine": false,
          "text": "прийду з піцою"
        }
      ]
    },
    {
      "name": "Едік",
      "messages": [
        {
          "mine": true,
          "text": "комп твій ожив?"
        },
        {
          "mine": false,
          "text": "переставив систему, літає"
        },
        {
          "mine": true,
          "text": "оо круто"
        },
        {
          "mine": false,
          "text": "приходь заберемо той монітор"
        },
        {
          "mine": true,
          "text": "завтра зайду"
        }
      ]
    },
    {
      "name": "Віталік",
      "messages": [
        {
          "mine": false,
          "text": "риболовля в суботу?"
        },
        {
          "mine": true,
          "text": "погоду глянь"
        },
        {
          "mine": false,
          "text": "тихо і хмарно, самий клювак"
        },
        {
          "mine": true,
          "text": "ок о 5 виїзд"
        },
        {
          "mine": false,
          "text": "чекаю на заправці"
        }
      ]
    },
    {
      "name": "Роксолана",
      "messages": [
        {
          "mine": true,
          "text": "ти на йогу сьогодні"
        },
        {
          "mine": false,
          "text": "так, ранкова"
        },
        {
          "mine": false,
          "text": "приходь, місця є"
        },
        {
          "mine": true,
          "text": "не встигну, робота"
        },
        {
          "mine": false,
          "text": "тоді ввечері"
        }
      ]
    },
    {
      "name": "Юрко",
      "messages": [
        {
          "mine": false,
          "text": "здоров, як переїзд пройшов"
        },
        {
          "mine": true,
          "text": "нормально, спина болить хД"
        },
        {
          "mine": false,
          "text": "ну ще б"
        },
        {
          "mine": true,
          "text": "прийдеш новосілля відзначити"
        },
        {
          "mine": false,
          "text": "коли скажеш тоді і буду"
        }
      ]
    },
    {
      "name": "Настя школа",
      "messages": [
        {
          "mine": true,
          "text": "памʼятаєш нашу класну"
        },
        {
          "mine": false,
          "text": "звісно, шо з нею"
        },
        {
          "mine": true,
          "text": "зустріч однокласників планують"
        },
        {
          "mine": false,
          "text": "ооо я за"
        },
        {
          "mine": true,
          "text": "додам тебе в чат"
        }
      ]
    },
    {
      "name": "Олег гараж",
      "messages": [
        {
          "mine": false,
          "text": "заскочиш подивитись стук в підвісці"
        },
        {
          "mine": true,
          "text": "коли зручно"
        },
        {
          "mine": false,
          "text": "після обіда"
        },
        {
          "mine": true,
          "text": "ок під 3 буду"
        },
        {
          "mine": false,
          "text": "чекаю"
        }
      ]
    },
    {
      "name": "Маха робота",
      "messages": [
        {
          "mine": true,
          "text": "каву будеш? йду по неї"
        },
        {
          "mine": false,
          "text": "так, латте"
        },
        {
          "mine": true,
          "text": "цукор?"
        },
        {
          "mine": false,
          "text": "без, дякую"
        },
        {
          "mine": true,
          "text": "несу"
        }
      ]
    },
    {
      "name": "Тарас зал",
      "messages": [
        {
          "mine": false,
          "text": "ти прогресуєш в жимі?"
        },
        {
          "mine": true,
          "text": "плюс 5 кіло за місяць"
        },
        {
          "mine": false,
          "text": "красава"
        },
        {
          "mine": true,
          "text": "разом більше вийде"
        },
        {
          "mine": false,
          "text": "завтра перевіримо"
        }
      ]
    },
    {
      "name": "Ксюша універ",
      "messages": [
        {
          "mine": true,
          "text": "здала лабу?"
        },
        {
          "mine": false,
          "text": "викладач не прийняв(("
        },
        {
          "mine": true,
          "text": "чому"
        },
        {
          "mine": false,
          "text": "каже переробити висновки"
        },
        {
          "mine": true,
          "text": "поможу ввечері як хочеш"
        },
        {
          "mine": false,
          "text": "ти супер дякую"
        }
      ]
    },
    {
      "name": "Ромчик хата",
      "messages": [
        {
          "mine": false,
          "text": "хто останній йшов світло лишив"
        },
        {
          "mine": true,
          "text": "ой сорі я"
        },
        {
          "mine": false,
          "text": "та нічого просто вимикай"
        },
        {
          "mine": true,
          "text": "буду уважніше"
        }
      ]
    },
    {
      "name": "Ленка сусідка",
      "messages": [
        {
          "mine": true,
          "text": "візьмеш посилку якшо мене не буде"
        },
        {
          "mine": false,
          "text": "звісно, лиш скажи коли"
        },
        {
          "mine": true,
          "text": "завтра десь до обіда"
        },
        {
          "mine": false,
          "text": "буду вдома, занесу"
        },
        {
          "mine": true,
          "text": "дякую тобі"
        }
      ]
    },
    {
      "name": "Сеня футбол",
      "messages": [
        {
          "mine": false,
          "text": "форму випрали?"
        },
        {
          "mine": true,
          "text": "сохне ще"
        },
        {
          "mine": false,
          "text": "на завтра встигне?"
        },
        {
          "mine": true,
          "text": "має"
        },
        {
          "mine": false,
          "text": "бо без форми не пущу на поле хД"
        }
      ]
    },
    {
      "name": "Даня двір",
      "messages": [
        {
          "mine": true,
          "text": "виходь надвір, всі внизу"
        },
        {
          "mine": false,
          "text": "зара доїм і виходжу"
        },
        {
          "mine": false,
          "text": "шо робите"
        },
        {
          "mine": true,
          "text": "та просто сидимо"
        },
        {
          "mine": false,
          "text": "ок йду"
        }
      ]
    },
    {
      "name": "Валя робота",
      "messages": [
        {
          "mine": false,
          "text": "нараду перенесли?"
        },
        {
          "mine": true,
          "text": "так, на 3"
        },
        {
          "mine": false,
          "text": "фух встигну доробити"
        },
        {
          "mine": true,
          "text": "скинь як буде готово"
        },
        {
          "mine": false,
          "text": "ок"
        }
      ]
    },
    {
      "name": "Владік",
      "messages": [
        {
          "mine": true,
          "text": "ти зробив домашку з мат аналізу"
        },
        {
          "mine": false,
          "text": "половину"
        },
        {
          "mine": true,
          "text": "скинь шо є"
        },
        {
          "mine": false,
          "text": "тримай, останні два сам мучся хД"
        },
        {
          "mine": true,
          "text": "дякую і на тому"
        }
      ]
    },
    {
      "name": "Мілана",
      "messages": [
        {
          "mine": false,
          "text": "ти бачила яка сьогодні погода"
        },
        {
          "mine": true,
          "text": "краса, аж гуляти хочеться"
        },
        {
          "mine": false,
          "text": "го в парк ввечері"
        },
        {
          "mine": true,
          "text": "давай після 6"
        },
        {
          "mine": false,
          "text": "морозиво з мене"
        },
        {
          "mine": true,
          "text": "продано"
        }
      ]
    },
    {
      "name": "Гоша",
      "messages": [
        {
          "mine": true,
          "text": "приставку налаштував?"
        },
        {
          "mine": false,
          "text": "так, заходь пограємо"
        },
        {
          "mine": true,
          "text": "ввечері зайду"
        },
        {
          "mine": false,
          "text": "бери джойстик другий бо мій глючить"
        },
        {
          "mine": true,
          "text": "окей"
        }
      ]
    },
    {
      "name": "Люба",
      "messages": [
        {
          "mine": false,
          "text": "ти квіти полила поки мене не було"
        },
        {
          "mine": true,
          "text": "полила всі, навіть той кактус"
        },
        {
          "mine": false,
          "text": "кактус не треба було хД"
        },
        {
          "mine": true,
          "text": "ну звідки я знав"
        },
        {
          "mine": false,
          "text": "та нічого, живий?"
        },
        {
          "mine": true,
          "text": "живіший за всіх"
        }
      ]
    },
    {
      "name": "Свят",
      "messages": [
        {
          "mine": true,
          "text": "ти на пробіжку ранкову?"
        },
        {
          "mine": false,
          "text": "проспав, вибач"
        },
        {
          "mine": true,
          "text": "знову"
        },
        {
          "mine": false,
          "text": "завтра точно встану"
        },
        {
          "mine": true,
          "text": "ага, вірю хД"
        }
      ]
    },
    {
      "name": "Ната Р",
      "messages": [
        {
          "mine": false,
          "text": "як пройшла співбесіда"
        },
        {
          "mine": true,
          "text": "начебто добре, обіцяли передзвонити"
        },
        {
          "mine": false,
          "text": "тримаю кулаки"
        },
        {
          "mine": true,
          "text": "дякую, дуже хочу цю роботу"
        },
        {
          "mine": false,
          "text": "все буде"
        }
      ]
    },
    {
      "name": "Максим К",
      "messages": [
        {
          "mine": true,
          "text": "ти взяв мою книжку памʼятаєш"
        },
        {
          "mine": false,
          "text": "яку"
        },
        {
          "mine": true,
          "text": "ту про космос"
        },
        {
          "mine": false,
          "text": "а точно, дочитую, супер"
        },
        {
          "mine": true,
          "text": "верни як дочитаєш"
        },
        {
          "mine": false,
          "text": "обовʼязково"
        }
      ]
    },
    {
      "name": "Юлька",
      "messages": [
        {
          "mine": false,
          "text": "го завтра по магазинах"
        },
        {
          "mine": true,
          "text": "мені нічого не треба але піду за компанію"
        },
        {
          "mine": false,
          "text": "ти завжди так кажеш і купуєш більше за мене"
        },
        {
          "mine": true,
          "text": "хД правда"
        },
        {
          "mine": false,
          "text": "о котрій"
        },
        {
          "mine": true,
          "text": "після 12"
        }
      ]
    },
    {
      "name": "Ірка",
      "messages": [
        {
          "mine": true,
          "text": "ти доїхала?"
        },
        {
          "mine": false,
          "text": "так, щойно зайшла додому"
        },
        {
          "mine": true,
          "text": "фух, а то хвилювалась"
        },
        {
          "mine": false,
          "text": "все ок, дякую шо провела"
        },
        {
          "mine": true,
          "text": "завжди"
        }
      ]
    },
    {
      "name": "Дзвінка",
      "messages": [
        {
          "mine": false,
          "text": "чула ти торт спекла на конкурс"
        },
        {
          "mine": true,
          "text": "так, третє місце)"
        },
        {
          "mine": false,
          "text": "ого вітаю"
        },
        {
          "mine": true,
          "text": "наступного разу перше візьму"
        },
        {
          "mine": false,
          "text": "не сумніваюсь, ти майстриня"
        }
      ]
    }
  ],
  "tr": [
    {
      "name": "Elif ❤️",
      "messages": [
        {
          "mine": false,
          "text": "napiyon"
        },
        {
          "mine": true,
          "text": "yatiyorum ya, cok yorgunum bugun"
        },
        {
          "mine": false,
          "text": "yaa ben de :("
        },
        {
          "mine": true,
          "text": "yarin gorusuyo muyuz"
        },
        {
          "mine": false,
          "text": "aynen aksama musaitim"
        },
        {
          "mine": true,
          "text": "tmm o zaman sabah yazarim"
        },
        {
          "mine": false,
          "text": "iyi geceler askim"
        }
      ]
    },
    {
      "name": "Emre",
      "messages": [
        {
          "mine": true,
          "text": "kanka mac kacta"
        },
        {
          "mine": false,
          "text": "9 gibi"
        },
        {
          "mine": false,
          "text": "gelcen mi"
        },
        {
          "mine": true,
          "text": "bilmiyorum daha, isten cikinca ararim"
        },
        {
          "mine": false,
          "text": "tmm haber et"
        }
      ]
    },
    {
      "name": "Zeynep",
      "messages": [
        {
          "mine": false,
          "text": "sen dun cok sinirliydin ya iyi misin"
        },
        {
          "mine": true,
          "text": "yaa is olayi cok sardi kafami"
        },
        {
          "mine": false,
          "text": "anlatsana"
        },
        {
          "mine": true,
          "text": "sonra ararim uzun mevzu"
        },
        {
          "mine": false,
          "text": "tmm bekliyorum bak"
        }
      ]
    },
    {
      "name": "Can",
      "messages": [
        {
          "mine": false,
          "text": "abi o dosyayi atabildin mi"
        },
        {
          "mine": true,
          "text": "yok daha, aksam bakarim"
        },
        {
          "mine": false,
          "text": "acele degil"
        },
        {
          "mine": true,
          "text": "tamamdir"
        }
      ]
    },
    {
      "name": "Merve",
      "messages": [
        {
          "mine": true,
          "text": "sen bugun geldin mi"
        },
        {
          "mine": false,
          "text": "yok evdeyim, biraz hastayim"
        },
        {
          "mine": true,
          "text": "gecmis olsun ya"
        },
        {
          "mine": false,
          "text": "sagol, cay icip yatiyorum"
        },
        {
          "mine": true,
          "text": "iyi dinlen kendine bak"
        }
      ]
    },
    {
      "name": "Efe",
      "messages": [
        {
          "mine": false,
          "text": "kanka o oyunu aldin mi sonunda"
        },
        {
          "mine": true,
          "text": "aldim ya baya iyimis"
        },
        {
          "mine": false,
          "text": "aksam acalim mi"
        },
        {
          "mine": true,
          "text": "olur 8 de musaitim"
        },
        {
          "mine": false,
          "text": "tmm"
        }
      ]
    },
    {
      "name": "Ayşe okul",
      "messages": [
        {
          "mine": false,
          "text": "yarin sunum var unutma"
        },
        {
          "mine": true,
          "text": "of ya hazir degilim daha"
        },
        {
          "mine": false,
          "text": "ben de hicbisey yapmadim"
        },
        {
          "mine": true,
          "text": "sabah erken gelip bakalim mi"
        },
        {
          "mine": false,
          "text": "olur 8.30 kutuphane"
        },
        {
          "mine": true,
          "text": "tmm gorusuruz"
        }
      ]
    },
    {
      "name": "Kerem ev",
      "messages": [
        {
          "mine": true,
          "text": "cop dolmus bu arada"
        },
        {
          "mine": false,
          "text": "ben cikarirken atarim bugun"
        },
        {
          "mine": true,
          "text": "sagol"
        },
        {
          "mine": false,
          "text": "sut de bitmis aldin mi"
        },
        {
          "mine": true,
          "text": "unuttum ya donerken alirim"
        }
      ]
    },
    {
      "name": "Anne",
      "messages": [
        {
          "mine": false,
          "text": "yemek yedin mi"
        },
        {
          "mine": true,
          "text": "yedim anne merak etme"
        },
        {
          "mine": false,
          "text": "ne yaptin"
        },
        {
          "mine": true,
          "text": "makarna, disari cikcaktim ama usendim"
        },
        {
          "mine": false,
          "text": "erken yat kendine iyi bak"
        },
        {
          "mine": true,
          "text": "tamam sen de"
        }
      ]
    },
    {
      "name": "Baba",
      "messages": [
        {
          "mine": false,
          "text": "araba muayeneye gitti mi"
        },
        {
          "mine": true,
          "text": "hafta sonu goturcem baba"
        },
        {
          "mine": false,
          "text": "geciktirme sonra ceza yersin"
        },
        {
          "mine": true,
          "text": "hallederim merak etme"
        }
      ]
    },
    {
      "name": "Babaanne",
      "messages": [
        {
          "mine": false,
          "text": "kuzum ne zaman gelirsin"
        },
        {
          "mine": true,
          "text": "pazar gelmeye calisirim babaanne"
        },
        {
          "mine": false,
          "text": "boregini yaptim bak"
        },
        {
          "mine": true,
          "text": "off canim cekti simdi :)"
        },
        {
          "mine": false,
          "text": "gel de ye o zaman"
        }
      ]
    },
    {
      "name": "Dede",
      "messages": [
        {
          "mine": true,
          "text": "dede naber iyi misin"
        },
        {
          "mine": false,
          "text": "iyiyiz evladim sen nasilsin"
        },
        {
          "mine": true,
          "text": "iyiyim calisiyorum bayagi"
        },
        {
          "mine": false,
          "text": "kendini yorma cok"
        },
        {
          "mine": true,
          "text": "merak etme :)"
        }
      ]
    },
    {
      "name": "Anneanne",
      "messages": [
        {
          "mine": false,
          "text": "geldin mi eve"
        },
        {
          "mine": true,
          "text": "yeni geldim anneanne"
        },
        {
          "mine": false,
          "text": "usutme uzeri ort"
        },
        {
          "mine": true,
          "text": "tamam tamam"
        }
      ]
    },
    {
      "name": "kızlar",
      "messages": [
        {
          "mine": false,
          "text": "bu cumartesi ne yapiyoruz"
        },
        {
          "mine": true,
          "text": "disari cikalim ya cok sikildim"
        },
        {
          "mine": false,
          "text": "o yeni mekana gidelim mi"
        },
        {
          "mine": false,
          "text": "ben varim"
        },
        {
          "mine": true,
          "text": "kacta"
        },
        {
          "mine": false,
          "text": "8 gibi toplaniriz"
        },
        {
          "mine": true,
          "text": "tmm rezervasyon yapayim mi"
        },
        {
          "mine": false,
          "text": "yap yap"
        }
      ]
    },
    {
      "name": "aile",
      "messages": [
        {
          "mine": false,
          "text": "pazar ogle yemekte herkes bekleniyor"
        },
        {
          "mine": true,
          "text": "gelirim ben"
        },
        {
          "mine": false,
          "text": "ben de"
        },
        {
          "mine": false,
          "text": "kim ne getiriyor"
        },
        {
          "mine": true,
          "text": "ben tatli alirim"
        },
        {
          "mine": false,
          "text": "harika"
        }
      ]
    },
    {
      "name": "ev",
      "messages": [
        {
          "mine": false,
          "text": "faturayi kim odedi"
        },
        {
          "mine": true,
          "text": "ben odedim, sonra bolusuruz"
        },
        {
          "mine": false,
          "text": "tamam atarim payimi"
        },
        {
          "mine": false,
          "text": "bu arada wifi yine kesildi mi sizde"
        },
        {
          "mine": true,
          "text": "evet ya cok sinir"
        }
      ]
    },
    {
      "name": "halı saha",
      "messages": [
        {
          "mine": false,
          "text": "bu hafta sali saat 9"
        },
        {
          "mine": true,
          "text": "ben varim"
        },
        {
          "mine": false,
          "text": "kaci kaldik"
        },
        {
          "mine": false,
          "text": "8 kisi olduk 2 eksik"
        },
        {
          "mine": true,
          "text": "ben birini ayarlarim"
        },
        {
          "mine": false,
          "text": "tmm eksik kalmasin"
        }
      ]
    },
    {
      "name": "kankalar",
      "messages": [
        {
          "mine": true,
          "text": "aksam bi yerde bulusalim mi"
        },
        {
          "mine": false,
          "text": "napcaz"
        },
        {
          "mine": true,
          "text": "bilmiyorum takilalim iste"
        },
        {
          "mine": false,
          "text": "ben yorgunum ya"
        },
        {
          "mine": false,
          "text": "ben varim gelirim"
        },
        {
          "mine": true,
          "text": "hadi 2 kisi de olsa cikalim"
        }
      ]
    },
    {
      "name": "Selin",
      "messages": [
        {
          "mine": false,
          "text": "o dizi bittiy mi sende"
        },
        {
          "mine": true,
          "text": "bitti ya son bolum cok sasirttim"
        },
        {
          "mine": false,
          "text": "spoiler verme dur"
        },
        {
          "mine": true,
          "text": "vermem vermem :)"
        },
        {
          "mine": false,
          "text": "bu aksam bitiricem"
        }
      ]
    },
    {
      "name": "Deniz",
      "messages": [
        {
          "mine": true,
          "text": "geliyon mu"
        },
        {
          "mine": false,
          "text": "yoldayim 10 dk"
        },
        {
          "mine": true,
          "text": "tmm ben icerdeyim"
        },
        {
          "mine": false,
          "text": "nerde oturdun"
        },
        {
          "mine": true,
          "text": "arka tarafta cam kenari"
        }
      ]
    },
    {
      "name": "Burak",
      "messages": [
        {
          "mine": false,
          "text": "abi arabayi bi ara verir misin cumartesi"
        },
        {
          "mine": true,
          "text": "napcan"
        },
        {
          "mine": false,
          "text": "tasinmam var ufak tefek esya"
        },
        {
          "mine": true,
          "text": "tmm sabah musaitim"
        },
        {
          "mine": false,
          "text": "eyvallah cok sagol"
        }
      ]
    },
    {
      "name": "Ece",
      "messages": [
        {
          "mine": false,
          "text": "aaa seni bugun carsida gordum gibi"
        },
        {
          "mine": true,
          "text": "bendim evet niye seslenmedin"
        },
        {
          "mine": false,
          "text": "emin olamadim uzaktaydi"
        },
        {
          "mine": true,
          "text": "haha gel bi kahve icelim yakinda"
        },
        {
          "mine": false,
          "text": "olur bu hafta ayarlayalim"
        }
      ]
    },
    {
      "name": "Mert",
      "messages": [
        {
          "mine": true,
          "text": "odev bitti mi sende"
        },
        {
          "mine": false,
          "text": "yok ya hic baslamadim"
        },
        {
          "mine": true,
          "text": "ayni durumdayiz"
        },
        {
          "mine": false,
          "text": "yarin sabaha kadar :("
        },
        {
          "mine": true,
          "text": "birlikte oturalim mi kutuphanede"
        },
        {
          "mine": false,
          "text": "olur gelirim"
        }
      ]
    },
    {
      "name": "Cansu",
      "messages": [
        {
          "mine": false,
          "text": "napiyon"
        },
        {
          "mine": true,
          "text": "hicbisey dizi aciyorum"
        },
        {
          "mine": false,
          "text": "ben cok sikildim gel bi yere gidelim"
        },
        {
          "mine": true,
          "text": "usendim ya yarin"
        },
        {
          "mine": false,
          "text": "hep boyle diyorsun :("
        }
      ]
    },
    {
      "name": "Ozan",
      "messages": [
        {
          "mine": false,
          "text": "mac skoru ne oldu"
        },
        {
          "mine": true,
          "text": "2 1 kazandik son dakika golu"
        },
        {
          "mine": false,
          "text": "yok artik kacirdim ya"
        },
        {
          "mine": true,
          "text": "muhtesemdi valla"
        }
      ]
    },
    {
      "name": "Sena",
      "messages": [
        {
          "mine": true,
          "text": "dogum gunun icin ne alalim"
        },
        {
          "mine": false,
          "text": "kime"
        },
        {
          "mine": true,
          "text": "irem'e ya cuma"
        },
        {
          "mine": false,
          "text": "aa unutmusum, ortak alalim mi"
        },
        {
          "mine": true,
          "text": "olur bir bakarim guzel bisey"
        }
      ]
    },
    {
      "name": "Berk",
      "messages": [
        {
          "mine": false,
          "text": "kanka bugun spora gidiyon mu"
        },
        {
          "mine": true,
          "text": "gitcem 6 gibi"
        },
        {
          "mine": false,
          "text": "ben de gelirim beraber gidelim"
        },
        {
          "mine": true,
          "text": "tmm asagida bekle"
        }
      ]
    },
    {
      "name": "İrem",
      "messages": [
        {
          "mine": false,
          "text": "sana bi sey soracaktim"
        },
        {
          "mine": true,
          "text": "sor"
        },
        {
          "mine": false,
          "text": "cumartesi bosmusun sen"
        },
        {
          "mine": true,
          "text": "sanirim evet napcaz"
        },
        {
          "mine": false,
          "text": "sonra soylerim surpriz"
        },
        {
          "mine": true,
          "text": "haha tamam merakta biraktin"
        }
      ]
    },
    {
      "name": "Kaan",
      "messages": [
        {
          "mine": true,
          "text": "abi para ustu kaldi bende dunku"
        },
        {
          "mine": false,
          "text": "onemli degil ya sonra"
        },
        {
          "mine": true,
          "text": "yok atayim unuturuz"
        },
        {
          "mine": false,
          "text": "tmm eyvallah"
        }
      ]
    },
    {
      "name": "Buse",
      "messages": [
        {
          "mine": false,
          "text": "sac kestirdim nasil olmus"
        },
        {
          "mine": true,
          "text": "cok yakismis valla"
        },
        {
          "mine": false,
          "text": "emin misin kisa geldi bana"
        },
        {
          "mine": true,
          "text": "yok gercekten guzel olmus"
        },
        {
          "mine": false,
          "text": "of iyi rahatladim"
        }
      ]
    },
    {
      "name": "Tolga",
      "messages": [
        {
          "mine": true,
          "text": "yarin kac kisiyiz"
        },
        {
          "mine": false,
          "text": "5 oldik galiba"
        },
        {
          "mine": false,
          "text": "bi de belki ozan gelir"
        },
        {
          "mine": true,
          "text": "tmm masa ayarlayayim"
        }
      ]
    },
    {
      "name": "Gizem",
      "messages": [
        {
          "mine": false,
          "text": "cok kotu bir gun gecirdim ya"
        },
        {
          "mine": true,
          "text": "hayirdir napti gene"
        },
        {
          "mine": false,
          "text": "is yerinde herkes ustume geldi"
        },
        {
          "mine": true,
          "text": "boverr onlara, cikalim mi biraz"
        },
        {
          "mine": false,
          "text": "olur cok iyi olur"
        }
      ]
    },
    {
      "name": "Onur",
      "messages": [
        {
          "mine": false,
          "text": "o linki atsana"
        },
        {
          "mine": true,
          "text": "bi saniye buluyorum"
        },
        {
          "mine": false,
          "text": "tmm"
        },
        {
          "mine": true,
          "text": "attim bak"
        },
        {
          "mine": false,
          "text": "geldi eyvallah"
        }
      ]
    },
    {
      "name": "Yağmur",
      "messages": [
        {
          "mine": true,
          "text": "disarda yagmur mu basladi sizin orda"
        },
        {
          "mine": false,
          "text": "evet ya bardaktan bosaniyor"
        },
        {
          "mine": true,
          "text": "eyvah samsiz ciktim"
        },
        {
          "mine": false,
          "text": "haha adin ustunde bari"
        },
        {
          "mine": true,
          "text": "cok komiksin :)"
        }
      ]
    },
    {
      "name": "Barış",
      "messages": [
        {
          "mine": false,
          "text": "abi hafta sonu bi kamp yapalim mi"
        },
        {
          "mine": true,
          "text": "aa olur ya nereye"
        },
        {
          "mine": false,
          "text": "golun oraya, cadir alirim"
        },
        {
          "mine": true,
          "text": "ben mangal getiririm"
        },
        {
          "mine": false,
          "text": "tamamdir plan yapalim"
        }
      ]
    },
    {
      "name": "Melis",
      "messages": [
        {
          "mine": false,
          "text": "gelemiycem bu aksam kusura bakma"
        },
        {
          "mine": true,
          "text": "yaa niye"
        },
        {
          "mine": false,
          "text": "cok yorgunum uyuyakalcam"
        },
        {
          "mine": true,
          "text": "tmm sonra gorusuruz o zaman"
        },
        {
          "mine": false,
          "text": "sagol anladin :("
        }
      ]
    },
    {
      "name": "Serkan",
      "messages": [
        {
          "mine": true,
          "text": "toplanti kacta basliyodu"
        },
        {
          "mine": false,
          "text": "10 da"
        },
        {
          "mine": true,
          "text": "of gec kalcam trafik berbat"
        },
        {
          "mine": false,
          "text": "ben idare ederim gel sen"
        },
        {
          "mine": true,
          "text": "eyvallah kurtardin"
        }
      ]
    },
    {
      "name": "Pınar",
      "messages": [
        {
          "mine": false,
          "text": "o tarifi atar misin bana"
        },
        {
          "mine": true,
          "text": "hangisi keki mi"
        },
        {
          "mine": false,
          "text": "yok o mercimek corbasi"
        },
        {
          "mine": true,
          "text": "aa tmm yaziyorum simdi"
        },
        {
          "mine": false,
          "text": "cok sagol denicem bu aksam"
        }
      ]
    },
    {
      "name": "Uğur",
      "messages": [
        {
          "mine": false,
          "text": "geliyon mu bugun ofise"
        },
        {
          "mine": true,
          "text": "evden calisiyorum bugun"
        },
        {
          "mine": false,
          "text": "iyisin ha"
        },
        {
          "mine": true,
          "text": "haha bugunluk kacis"
        }
      ]
    },
    {
      "name": "Damla",
      "messages": [
        {
          "mine": true,
          "text": "napiyosun"
        },
        {
          "mine": false,
          "text": "annemlere geldim koydeyiz"
        },
        {
          "mine": true,
          "text": "aa ne guzel havalar nasil"
        },
        {
          "mine": false,
          "text": "muhtesem ya doga bambaska"
        },
        {
          "mine": true,
          "text": "keske ben de gelseydim"
        }
      ]
    },
    {
      "name": "Furkan",
      "messages": [
        {
          "mine": false,
          "text": "kanka o parcayi buldun mu"
        },
        {
          "mine": true,
          "text": "hangi parca"
        },
        {
          "mine": false,
          "text": "bisiklet icin demistin ya"
        },
        {
          "mine": true,
          "text": "aa evet siparis verdim geliyor"
        },
        {
          "mine": false,
          "text": "tamamdir haber et"
        }
      ]
    },
    {
      "name": "Ceren",
      "messages": [
        {
          "mine": false,
          "text": "sana kizgin degilim bu arada"
        },
        {
          "mine": true,
          "text": "iyi de dun cok soguktun"
        },
        {
          "mine": false,
          "text": "kafam doluydu pardon"
        },
        {
          "mine": true,
          "text": "tmm bosver konusuruz"
        },
        {
          "mine": false,
          "text": "sagol :)"
        }
      ]
    },
    {
      "name": "Sinem",
      "messages": [
        {
          "mine": true,
          "text": "kizim yarin ne giyicez"
        },
        {
          "mine": false,
          "text": "bilmiyorum ya kombin yapamadim"
        },
        {
          "mine": true,
          "text": "sade gidelim iste"
        },
        {
          "mine": false,
          "text": "olur cok ugrasmayalim"
        },
        {
          "mine": true,
          "text": "aynen"
        }
      ]
    },
    {
      "name": "Arda",
      "messages": [
        {
          "mine": false,
          "text": "abi yarin sinav var haberin var mi"
        },
        {
          "mine": true,
          "text": "ne sinavi yaa"
        },
        {
          "mine": false,
          "text": "istatistik"
        },
        {
          "mine": true,
          "text": "eyvah hic bakmadim"
        },
        {
          "mine": false,
          "text": "bu gece yaniyoruz beraber"
        }
      ]
    },
    {
      "name": "Ceyda",
      "messages": [
        {
          "mine": false,
          "text": "fotolar cok guzel olmus"
        },
        {
          "mine": true,
          "text": "degil mi ya bayildim"
        },
        {
          "mine": false,
          "text": "bana da atar misin"
        },
        {
          "mine": true,
          "text": "hepsini atarim albumu paylasayim"
        },
        {
          "mine": false,
          "text": "sagol canim"
        }
      ]
    },
    {
      "name": "Batu",
      "messages": [
        {
          "mine": true,
          "text": "aksam oyun var mi"
        },
        {
          "mine": false,
          "text": "olur birazdan giriyorum"
        },
        {
          "mine": false,
          "text": "digerlerini de cagirayim mi"
        },
        {
          "mine": true,
          "text": "cagir tam takim olsun"
        }
      ]
    },
    {
      "name": "Nazlı",
      "messages": [
        {
          "mine": false,
          "text": "yemek yaptim sana da ayirdim"
        },
        {
          "mine": true,
          "text": "aa cok iyisin sagol"
        },
        {
          "mine": false,
          "text": "gelince alirsin dolapta"
        },
        {
          "mine": true,
          "text": "tmm gece atistiririm :)"
        }
      ]
    },
    {
      "name": "Doruk",
      "messages": [
        {
          "mine": false,
          "text": "o filmi izledin mi"
        },
        {
          "mine": true,
          "text": "izledim ya cok uzundu"
        },
        {
          "mine": false,
          "text": "sonu nasildi"
        },
        {
          "mine": true,
          "text": "spoiler istemezsin :)"
        },
        {
          "mine": false,
          "text": "haha tmm ben izlerim"
        }
      ]
    },
    {
      "name": "Aslı",
      "messages": [
        {
          "mine": true,
          "text": "geldin mi eve"
        },
        {
          "mine": false,
          "text": "yok daha yoldayim"
        },
        {
          "mine": true,
          "text": "ekmek alir misin geberken"
        },
        {
          "mine": false,
          "text": "tmm alirim"
        },
        {
          "mine": true,
          "text": "eyvallah"
        }
      ]
    },
    {
      "name": "Cem",
      "messages": [
        {
          "mine": false,
          "text": "abi bu hafta gelemiycem antrenmana"
        },
        {
          "mine": true,
          "text": "hayirdir"
        },
        {
          "mine": false,
          "text": "dizim agriyor biraz dinlensin"
        },
        {
          "mine": true,
          "text": "gecmis olsun toparlan sen"
        },
        {
          "mine": false,
          "text": "sagol"
        }
      ]
    },
    {
      "name": "Nil",
      "messages": [
        {
          "mine": false,
          "text": "cok tatli bi kedi buldum sokakta"
        },
        {
          "mine": true,
          "text": "aaa fotosu"
        },
        {
          "mine": false,
          "text": "atiyorum bak minnos"
        },
        {
          "mine": true,
          "text": "off eritti beni"
        },
        {
          "mine": false,
          "text": "sahiplenmeyi dusunuyorum ya"
        }
      ]
    },
    {
      "name": "Ege",
      "messages": [
        {
          "mine": true,
          "text": "denize gidiyor muyuz yarin"
        },
        {
          "mine": false,
          "text": "hava nasilmis"
        },
        {
          "mine": true,
          "text": "gunesli gozuktu"
        },
        {
          "mine": false,
          "text": "o zaman gidelim sabah cikalim"
        },
        {
          "mine": true,
          "text": "tmm 9 da alirim seni"
        }
      ]
    },
    {
      "name": "Beren",
      "messages": [
        {
          "mine": false,
          "text": "of yine gec kaldim ise"
        },
        {
          "mine": true,
          "text": "haha her sabah ayni"
        },
        {
          "mine": false,
          "text": "alarmi duymuyorum ki"
        },
        {
          "mine": true,
          "text": "bi surahi su koy yataginin yanina dokulunce uyanirsin"
        },
        {
          "mine": false,
          "text": "cok sacmasin :D"
        }
      ]
    },
    {
      "name": "Alp",
      "messages": [
        {
          "mine": false,
          "text": "o kitabi bitirdin mi"
        },
        {
          "mine": true,
          "text": "yariladim baya sarici"
        },
        {
          "mine": false,
          "text": "bana verir misin bitince"
        },
        {
          "mine": true,
          "text": "tabii getiririm hafta sonu"
        }
      ]
    },
    {
      "name": "Duru",
      "messages": [
        {
          "mine": true,
          "text": "canim sikkin bugun"
        },
        {
          "mine": false,
          "text": "neden ya"
        },
        {
          "mine": true,
          "text": "bilmiyorum boyle bir hal iste"
        },
        {
          "mine": false,
          "text": "gel sarilalim geciyor"
        },
        {
          "mine": true,
          "text": "off iyi geldi bu :)"
        }
      ]
    },
    {
      "name": "Kuzey",
      "messages": [
        {
          "mine": false,
          "text": "abi maca geliyon mu"
        },
        {
          "mine": true,
          "text": "bilet var mi hala"
        },
        {
          "mine": false,
          "text": "2 tane aldim sana da"
        },
        {
          "mine": true,
          "text": "eyvallah paranı vereyim"
        },
        {
          "mine": false,
          "text": "sonra bosver"
        }
      ]
    },
    {
      "name": "Defne",
      "messages": [
        {
          "mine": false,
          "text": "yarin kahvalti yapalim mi"
        },
        {
          "mine": true,
          "text": "olur nerde"
        },
        {
          "mine": false,
          "text": "o kose mekan cok guzelmis"
        },
        {
          "mine": true,
          "text": "tmm 11 gibi"
        },
        {
          "mine": false,
          "text": "harika gorusuruz"
        }
      ]
    },
    {
      "name": "Sarp",
      "messages": [
        {
          "mine": true,
          "text": "sarj aletini unutmussun bende"
        },
        {
          "mine": false,
          "text": "aa iyi ki soyledin"
        },
        {
          "mine": false,
          "text": "yarin alirim"
        },
        {
          "mine": true,
          "text": "tmm kapida birakirim"
        }
      ]
    },
    {
      "name": "Ela",
      "messages": [
        {
          "mine": false,
          "text": "sana surpriz hazirladim ama soyleyemem"
        },
        {
          "mine": true,
          "text": "yaaa soyle ne"
        },
        {
          "mine": false,
          "text": "olmaz surprizin tadi kacar"
        },
        {
          "mine": true,
          "text": "cok merak ettim simdi"
        },
        {
          "mine": false,
          "text": "sabret biraz :)"
        }
      ]
    },
    {
      "name": "Yusuf",
      "messages": [
        {
          "mine": false,
          "text": "abi kod calisiyor mu sende"
        },
        {
          "mine": true,
          "text": "bende de hata veriyor"
        },
        {
          "mine": false,
          "text": "of sabahtan beri ugrasiyorum"
        },
        {
          "mine": true,
          "text": "ekran paylasalim bi bakalim"
        },
        {
          "mine": false,
          "text": "tmm ariyorum"
        }
      ]
    },
    {
      "name": "Öykü",
      "messages": [
        {
          "mine": true,
          "text": "napiyon canim"
        },
        {
          "mine": false,
          "text": "ders calisiyorum patliyorum"
        },
        {
          "mine": true,
          "text": "ara ver biraz kafa dagit"
        },
        {
          "mine": false,
          "text": "veremiyorum yarin sinav"
        },
        {
          "mine": true,
          "text": "kolay gelsin o zaman :("
        }
      ]
    },
    {
      "name": "Tuna",
      "messages": [
        {
          "mine": false,
          "text": "geldik mekana neredesin"
        },
        {
          "mine": true,
          "text": "yoldayim az kaldi"
        },
        {
          "mine": false,
          "text": "hadi ya bekliyoruz"
        },
        {
          "mine": true,
          "text": "5 dk soz"
        }
      ]
    },
    {
      "name": "Lara",
      "messages": [
        {
          "mine": false,
          "text": "o ayakkabiyi aldin mi sonunda"
        },
        {
          "mine": true,
          "text": "aldim ya indirim vardi"
        },
        {
          "mine": false,
          "text": "aa ne kadara"
        },
        {
          "mine": true,
          "text": "yari fiyatina resmen"
        },
        {
          "mine": false,
          "text": "sanslisin link atar misin"
        }
      ]
    },
    {
      "name": "Poyraz",
      "messages": [
        {
          "mine": true,
          "text": "ruzgar cok sert bugun"
        },
        {
          "mine": false,
          "text": "evet ya sapkam ucup gitti"
        },
        {
          "mine": true,
          "text": "haha nerde simdi"
        },
        {
          "mine": false,
          "text": "gitti gonlum ferah :D"
        }
      ]
    },
    {
      "name": "Zehra",
      "messages": [
        {
          "mine": false,
          "text": "annen nasil iyilesti mi"
        },
        {
          "mine": true,
          "text": "iyi simdi cok sukur"
        },
        {
          "mine": false,
          "text": "cok sevindim gecmis olsun"
        },
        {
          "mine": true,
          "text": "sagol sordugun icin"
        }
      ]
    },
    {
      "name": "Mehmet spor",
      "messages": [
        {
          "mine": false,
          "text": "bugun bacak gunu unutma"
        },
        {
          "mine": true,
          "text": "of en sevmedigim gun"
        },
        {
          "mine": false,
          "text": "haha yok kacis, 6 da"
        },
        {
          "mine": true,
          "text": "tmm geliyorum"
        }
      ]
    },
    {
      "name": "Sude",
      "messages": [
        {
          "mine": true,
          "text": "kizim o mesaji gordun mu grupta"
        },
        {
          "mine": false,
          "text": "hangisi"
        },
        {
          "mine": true,
          "text": "cumartesi plani"
        },
        {
          "mine": false,
          "text": "aa gormedim bakiyorum"
        },
        {
          "mine": false,
          "text": "ben varim yaz beni"
        }
      ]
    },
    {
      "name": "Emir",
      "messages": [
        {
          "mine": false,
          "text": "abi ödünç 50 verir misin cebe sikistim"
        },
        {
          "mine": true,
          "text": "tabii atayim hemen"
        },
        {
          "mine": false,
          "text": "maasi alinca verecem"
        },
        {
          "mine": true,
          "text": "acelesi yok"
        }
      ]
    },
    {
      "name": "Işıl",
      "messages": [
        {
          "mine": false,
          "text": "yeni is nasil gidiyor"
        },
        {
          "mine": true,
          "text": "yogun ama seviyorum"
        },
        {
          "mine": false,
          "text": "ne guzel hayirli olsun"
        },
        {
          "mine": true,
          "text": "sagol bi ara anlatirim detayli"
        }
      ]
    },
    {
      "name": "Baran",
      "messages": [
        {
          "mine": true,
          "text": "aksam disari cikalim mi"
        },
        {
          "mine": false,
          "text": "param yok ya bu ay"
        },
        {
          "mine": true,
          "text": "evde takilalim o zaman film falan"
        },
        {
          "mine": false,
          "text": "olur cips alip gelirim"
        },
        {
          "mine": true,
          "text": "tmm bekliyorum"
        }
      ]
    },
    {
      "name": "Naz",
      "messages": [
        {
          "mine": false,
          "text": "cok ozledim seni ya"
        },
        {
          "mine": true,
          "text": "ben de canim ne zaman gorusuyoruz"
        },
        {
          "mine": false,
          "text": "bu hafta sonu bosum"
        },
        {
          "mine": true,
          "text": "o zaman kesin bulusalim"
        },
        {
          "mine": false,
          "text": "sozz"
        }
      ]
    },
    {
      "name": "Umut",
      "messages": [
        {
          "mine": false,
          "text": "abi sinav sonuclari cikmis"
        },
        {
          "mine": true,
          "text": "aa baktin mi"
        },
        {
          "mine": false,
          "text": "gectim ya oh"
        },
        {
          "mine": true,
          "text": "helal olsun kanka"
        },
        {
          "mine": false,
          "text": "sen de bak hemen"
        }
      ]
    },
    {
      "name": "Bade",
      "messages": [
        {
          "mine": true,
          "text": "yarin ne yapiyosun"
        },
        {
          "mine": false,
          "text": "bir plan yok, napcaz"
        },
        {
          "mine": true,
          "text": "alisverise cikalim mi"
        },
        {
          "mine": false,
          "text": "olur canim ihtiyacim var"
        },
        {
          "mine": true,
          "text": "tmm ogleden sonra"
        }
      ]
    },
    {
      "name": "Kağan",
      "messages": [
        {
          "mine": false,
          "text": "o belgeyi imzaladin mi"
        },
        {
          "mine": true,
          "text": "yok daha yarin bakarim"
        },
        {
          "mine": false,
          "text": "unutma onemli"
        },
        {
          "mine": true,
          "text": "tmm not aldim"
        }
      ]
    },
    {
      "name": "Ada",
      "messages": [
        {
          "mine": false,
          "text": "kahve icmeye var misin"
        },
        {
          "mine": true,
          "text": "varim tabii nerde"
        },
        {
          "mine": false,
          "text": "her zamanki yer"
        },
        {
          "mine": true,
          "text": "tmm 15 dk sonra oradayim"
        }
      ]
    },
    {
      "name": "Toprak",
      "messages": [
        {
          "mine": true,
          "text": "bahcedeki fideler tuttu mu"
        },
        {
          "mine": false,
          "text": "tuttu ya domatesler cikmis bile"
        },
        {
          "mine": true,
          "text": "aa harika fotosunu at"
        },
        {
          "mine": false,
          "text": "atiyorum bak minicikler"
        }
      ]
    },
    {
      "name": "Eylül",
      "messages": [
        {
          "mine": false,
          "text": "sonbahar geldi resmen"
        },
        {
          "mine": true,
          "text": "bayiliyorum bu havalara"
        },
        {
          "mine": false,
          "text": "yagmur yagsa da yuruyuse ciksak"
        },
        {
          "mine": true,
          "text": "olur ya hafta sonu"
        },
        {
          "mine": false,
          "text": "sozlestik"
        }
      ]
    },
    {
      "name": "Bora",
      "messages": [
        {
          "mine": false,
          "text": "abi arabada calan sarki neydi dun"
        },
        {
          "mine": true,
          "text": "hangisi"
        },
        {
          "mine": false,
          "text": "hani sen soyluyordun ya"
        },
        {
          "mine": true,
          "text": "haha bilmiyorum ki radyodaydi"
        },
        {
          "mine": false,
          "text": "of buldum bulacam"
        }
      ]
    },
    {
      "name": "Su",
      "messages": [
        {
          "mine": true,
          "text": "napiyon canim"
        },
        {
          "mine": false,
          "text": "yeni kalktim :)"
        },
        {
          "mine": true,
          "text": "saat 2 oldu ya"
        },
        {
          "mine": false,
          "text": "tatil iste bosver"
        },
        {
          "mine": true,
          "text": "keske ben de"
        }
      ]
    },
    {
      "name": "Çınar",
      "messages": [
        {
          "mine": false,
          "text": "o isi hallettin mi"
        },
        {
          "mine": true,
          "text": "hallettim cok sukur"
        },
        {
          "mine": false,
          "text": "oh be rahatladin"
        },
        {
          "mine": true,
          "text": "aynen ustumden yuk kalkti"
        }
      ]
    },
    {
      "name": "Rüya",
      "messages": [
        {
          "mine": false,
          "text": "cok garip bir ruya gordum seni"
        },
        {
          "mine": true,
          "text": "haha nasil"
        },
        {
          "mine": false,
          "text": "ucuyorduk falan sacma"
        },
        {
          "mine": true,
          "text": "adin ustunde zaten :)"
        },
        {
          "mine": false,
          "text": "aynen ya"
        }
      ]
    },
    {
      "name": "Kayra",
      "messages": [
        {
          "mine": true,
          "text": "yarin dogum gunun degil mi"
        },
        {
          "mine": false,
          "text": "evet ya hatirladin"
        },
        {
          "mine": true,
          "text": "tabii unutur muyum, kutlariz"
        },
        {
          "mine": false,
          "text": "off cok mutlu oldum"
        }
      ]
    },
    {
      "name": "Sıla",
      "messages": [
        {
          "mine": false,
          "text": "kizim sinema var misin"
        },
        {
          "mine": true,
          "text": "ne izlicez"
        },
        {
          "mine": false,
          "text": "o yeni korku filmi"
        },
        {
          "mine": true,
          "text": "eyvah korkarim ama gelirim"
        },
        {
          "mine": false,
          "text": "haha ben yanindayim"
        }
      ]
    },
    {
      "name": "Mira",
      "messages": [
        {
          "mine": false,
          "text": "o cantayi nerden aldin"
        },
        {
          "mine": true,
          "text": "hediyeydi sormadim bile"
        },
        {
          "mine": false,
          "text": "cok guzelmis"
        },
        {
          "mine": true,
          "text": "sagol :)"
        }
      ]
    },
    {
      "name": "Deren",
      "messages": [
        {
          "mine": true,
          "text": "geliyon mu bu aksam"
        },
        {
          "mine": false,
          "text": "gelemem ya misafir var bizde"
        },
        {
          "mine": true,
          "text": "tmm sonra gorusuruz"
        },
        {
          "mine": false,
          "text": "sen eglenmene bak"
        }
      ]
    },
    {
      "name": "Atlas",
      "messages": [
        {
          "mine": false,
          "text": "abi yolculuk nasil gecti"
        },
        {
          "mine": true,
          "text": "uzundu ama guzeldi"
        },
        {
          "mine": false,
          "text": "foto bekliyoruz ha"
        },
        {
          "mine": true,
          "text": "atarim yerlesince"
        }
      ]
    },
    {
      "name": "canım",
      "messages": [
        {
          "mine": false,
          "text": "iyi geceler bir tanem"
        },
        {
          "mine": true,
          "text": "iyi geceler, tatli ruyalar"
        },
        {
          "mine": false,
          "text": "yarin gorusuyoruz di mi"
        },
        {
          "mine": true,
          "text": "tabii ki, sabah ararim"
        },
        {
          "mine": false,
          "text": "opuyorum"
        }
      ]
    },
    {
      "name": "Yağız",
      "messages": [
        {
          "mine": true,
          "text": "kanka bilgisayari tamir ettirdin mi"
        },
        {
          "mine": false,
          "text": "ettirdim acildi cok sukur"
        },
        {
          "mine": true,
          "text": "oh be neydi sorun"
        },
        {
          "mine": false,
          "text": "fan bozulmus"
        }
      ]
    },
    {
      "name": "Nehir",
      "messages": [
        {
          "mine": false,
          "text": "cok sicak ya bugun"
        },
        {
          "mine": true,
          "text": "bayildim resmen"
        },
        {
          "mine": false,
          "text": "dondurma yiyelim mi"
        },
        {
          "mine": true,
          "text": "aa olur cikalim hemen"
        },
        {
          "mine": false,
          "text": "5 dk sonra asagida"
        }
      ]
    },
    {
      "name": "Kartal",
      "messages": [
        {
          "mine": false,
          "text": "abi mac bileti buldun mu"
        },
        {
          "mine": true,
          "text": "buldum 3 tane"
        },
        {
          "mine": false,
          "text": "supersin kime kime"
        },
        {
          "mine": true,
          "text": "sen ben bi de efe"
        },
        {
          "mine": false,
          "text": "tamamdir mukemmel"
        }
      ]
    },
    {
      "name": "Beril",
      "messages": [
        {
          "mine": true,
          "text": "kizim o mesaji sildin mi yanlislikla"
        },
        {
          "mine": false,
          "text": "hangisini"
        },
        {
          "mine": true,
          "text": "bana attigin uzun olan"
        },
        {
          "mine": false,
          "text": "aaa sildim ya pardon tekrar yazayim"
        },
        {
          "mine": true,
          "text": "haha tmm bekliyorum"
        }
      ]
    },
    {
      "name": "Tarık",
      "messages": [
        {
          "mine": false,
          "text": "abi kira arttı bu sene"
        },
        {
          "mine": true,
          "text": "off bizde de oyle"
        },
        {
          "mine": false,
          "text": "nereye gidiyor bu gidisat"
        },
        {
          "mine": true,
          "text": "bilmiyorum ya idare edicez"
        }
      ]
    },
    {
      "name": "Aleyna",
      "messages": [
        {
          "mine": false,
          "text": "yeni sac rengim nasil olmus soyle durust"
        },
        {
          "mine": true,
          "text": "cok yakismis valla harika"
        },
        {
          "mine": false,
          "text": "yalan soyleme :)"
        },
        {
          "mine": true,
          "text": "gercekten guzel olmus abartmiyorum"
        },
        {
          "mine": false,
          "text": "off sevdim ben de"
        }
      ]
    },
    {
      "name": "Görkem iş",
      "messages": [
        {
          "mine": false,
          "text": "sunumu bitirebildin mi"
        },
        {
          "mine": true,
          "text": "az kaldi bu aksam yollarim"
        },
        {
          "mine": false,
          "text": "tmm acele yok yarin sabaha kadar"
        },
        {
          "mine": true,
          "text": "eyvallah"
        }
      ]
    },
    {
      "name": "Meriç",
      "messages": [
        {
          "mine": true,
          "text": "hafta sonu koye gidiyoruz gelir misin"
        },
        {
          "mine": false,
          "text": "aa nereye"
        },
        {
          "mine": true,
          "text": "dedemlerin oraya, cok guzel"
        },
        {
          "mine": false,
          "text": "olur ya kacta cikiyoruz"
        },
        {
          "mine": true,
          "text": "cumartesi sabah"
        }
      ]
    },
    {
      "name": "yurt",
      "messages": [
        {
          "mine": false,
          "text": "su bitti kim gidiyor markete"
        },
        {
          "mine": true,
          "text": "ben cikcaktim alirim"
        },
        {
          "mine": false,
          "text": "bi de cikolata al lutfen"
        },
        {
          "mine": false,
          "text": "bana da :)"
        },
        {
          "mine": true,
          "text": "tmm herkese aliyorum"
        },
        {
          "mine": false,
          "text": "canimsin"
        }
      ]
    },
    {
      "name": "lise",
      "messages": [
        {
          "mine": false,
          "text": "bu sene bulusma yapalim mi ya"
        },
        {
          "mine": true,
          "text": "olur cok ozledim herkesi"
        },
        {
          "mine": false,
          "text": "yaz sonu iyi olur"
        },
        {
          "mine": true,
          "text": "ben tarih onerisi atarim"
        },
        {
          "mine": false,
          "text": "harika olur"
        }
      ]
    },
    {
      "name": "Kıvanç",
      "messages": [
        {
          "mine": true,
          "text": "abi o oyunda hangi levele geldin"
        },
        {
          "mine": false,
          "text": "12 takildim ya cok zor"
        },
        {
          "mine": true,
          "text": "ben gectim taktik vereyim"
        },
        {
          "mine": false,
          "text": "hadi kurtar beni"
        },
        {
          "mine": true,
          "text": "aksam sesli konusuruz"
        }
      ]
    },
    {
      "name": "Tuğçe",
      "messages": [
        {
          "mine": false,
          "text": "canim bugun cok guzel gorunuyodun"
        },
        {
          "mine": true,
          "text": "aa sagol ya moralim bozuktu iyi geldi"
        },
        {
          "mine": false,
          "text": "hep guzelsin zaten"
        },
        {
          "mine": true,
          "text": "seni seviyorum :)"
        }
      ]
    },
    {
      "name": "Berkay",
      "messages": [
        {
          "mine": false,
          "text": "kanka bu aksam cikiyo muyuz"
        },
        {
          "mine": true,
          "text": "cikalim ya evde patladim"
        },
        {
          "mine": false,
          "text": "kimler geliyor"
        },
        {
          "mine": true,
          "text": "birkac kisi ayarladim"
        },
        {
          "mine": false,
          "text": "tmm hazirlanip cikiyorum"
        },
        {
          "mine": true,
          "text": "hadi bekliyoruz"
        }
      ]
    }
  ],
  "zh": [
    {
      "name": "小雨",
      "messages": [
        {
          "mine": false,
          "text": "你到了吗"
        },
        {
          "mine": true,
          "text": "快了 还有两站"
        },
        {
          "mine": false,
          "text": "行 我先占个位子"
        },
        {
          "mine": true,
          "text": "好 帮我也点杯冰美式"
        },
        {
          "mine": false,
          "text": "收到"
        },
        {
          "mine": true,
          "text": "爱你哈哈"
        }
      ]
    },
    {
      "name": "浩子",
      "messages": [
        {
          "mine": true,
          "text": "在干嘛"
        },
        {
          "mine": false,
          "text": "打游戏 你呢"
        },
        {
          "mine": true,
          "text": "无聊死了"
        },
        {
          "mine": false,
          "text": "出来吃火锅？"
        },
        {
          "mine": true,
          "text": "走 几点"
        },
        {
          "mine": false,
          "text": "七点老地方"
        }
      ]
    },
    {
      "name": "婷婷",
      "messages": [
        {
          "mine": false,
          "text": "我今天新剪的头发"
        },
        {
          "mine": true,
          "text": "??"
        },
        {
          "mine": false,
          "text": "刘海剪短了 后悔死了"
        },
        {
          "mine": true,
          "text": "哈哈哈能有多短"
        },
        {
          "mine": false,
          "text": "别笑 我要哭了"
        },
        {
          "mine": true,
          "text": "过两天就长了 别慌"
        }
      ]
    },
    {
      "name": "阿伟",
      "messages": [
        {
          "mine": true,
          "text": "周末去爬山不"
        },
        {
          "mine": false,
          "text": "看天气吧 说下雨"
        },
        {
          "mine": true,
          "text": "那算了"
        },
        {
          "mine": false,
          "text": "改成打球？"
        },
        {
          "mine": true,
          "text": "行 叫上大鹏"
        }
      ]
    },
    {
      "name": "笑笑",
      "messages": [
        {
          "mine": false,
          "text": "你昨天那个链接发我一下"
        },
        {
          "mine": true,
          "text": "哪个"
        },
        {
          "mine": false,
          "text": "那个买鞋的"
        },
        {
          "mine": true,
          "text": "等下 我翻翻"
        },
        {
          "mine": false,
          "text": "谢啦"
        }
      ]
    },
    {
      "name": "安娜 室友",
      "messages": [
        {
          "mine": false,
          "text": "牛奶没了"
        },
        {
          "mine": true,
          "text": "回来的时候带一瓶"
        },
        {
          "mine": false,
          "text": "行 你要别的不"
        },
        {
          "mine": true,
          "text": "顺便来包纸巾吧"
        },
        {
          "mine": false,
          "text": "好滴"
        }
      ]
    },
    {
      "name": "小陈 公司",
      "messages": [
        {
          "mine": false,
          "text": "那个表格弄完了没"
        },
        {
          "mine": true,
          "text": "快了 下午发你"
        },
        {
          "mine": false,
          "text": "老板催了"
        },
        {
          "mine": true,
          "text": "知道了 我加把劲"
        },
        {
          "mine": false,
          "text": "辛苦"
        }
      ]
    },
    {
      "name": "琳 大学",
      "messages": [
        {
          "mine": true,
          "text": "好久没聊了"
        },
        {
          "mine": false,
          "text": "是啊 你最近咋样"
        },
        {
          "mine": true,
          "text": "忙成狗"
        },
        {
          "mine": false,
          "text": "哈哈都一样"
        },
        {
          "mine": true,
          "text": "啥时候聚一次"
        },
        {
          "mine": false,
          "text": "下个月吧 我看看时间"
        }
      ]
    },
    {
      "name": "宝",
      "messages": [
        {
          "mine": false,
          "text": "晚上想吃啥"
        },
        {
          "mine": true,
          "text": "随便 你定"
        },
        {
          "mine": false,
          "text": "又随便"
        },
        {
          "mine": true,
          "text": "那吃你上次说的那家"
        },
        {
          "mine": false,
          "text": "好 我订位"
        },
        {
          "mine": true,
          "text": "么么"
        }
      ]
    },
    {
      "name": "妈",
      "messages": [
        {
          "mine": false,
          "text": "今天冷 多穿点"
        },
        {
          "mine": true,
          "text": "知道啦"
        },
        {
          "mine": false,
          "text": "吃饭了没"
        },
        {
          "mine": true,
          "text": "刚吃完"
        },
        {
          "mine": false,
          "text": "别老点外卖"
        },
        {
          "mine": true,
          "text": "嗯嗯"
        }
      ]
    },
    {
      "name": "爸",
      "messages": [
        {
          "mine": true,
          "text": "家里那个热水器咋弄的"
        },
        {
          "mine": false,
          "text": "红色按钮按三秒"
        },
        {
          "mine": true,
          "text": "好了 谢谢老爸"
        },
        {
          "mine": false,
          "text": "回来看你妈"
        }
      ]
    },
    {
      "name": "奶奶",
      "messages": [
        {
          "mine": false,
          "text": "囡囡 周末回来吃饭吗"
        },
        {
          "mine": true,
          "text": "回 奶奶做红烧肉不"
        },
        {
          "mine": false,
          "text": "做 给你留着"
        },
        {
          "mine": true,
          "text": "嘿嘿 想你了"
        }
      ]
    },
    {
      "name": "爷爷",
      "messages": [
        {
          "mine": true,
          "text": "爷爷 血压量了没"
        },
        {
          "mine": false,
          "text": "量了 挺好"
        },
        {
          "mine": true,
          "text": "记得按时吃药哦"
        },
        {
          "mine": false,
          "text": "知道 你忙你的"
        }
      ]
    },
    {
      "name": "室友群",
      "messages": [
        {
          "mine": false,
          "text": "今晚谁洗碗"
        },
        {
          "mine": true,
          "text": "不是你吗"
        },
        {
          "mine": false,
          "text": "我上次洗的"
        },
        {
          "mine": false,
          "text": "阿福呢"
        },
        {
          "mine": true,
          "text": "阿福出去约会了草"
        },
        {
          "mine": false,
          "text": "那猜拳"
        }
      ]
    },
    {
      "name": "家庭群",
      "messages": [
        {
          "mine": false,
          "text": "周日中午都回来啊"
        },
        {
          "mine": true,
          "text": "我回"
        },
        {
          "mine": false,
          "text": "带上你弟"
        },
        {
          "mine": true,
          "text": "他说他有事"
        },
        {
          "mine": false,
          "text": "什么事比吃饭重要"
        }
      ]
    },
    {
      "name": "姐妹们",
      "messages": [
        {
          "mine": false,
          "text": "姐妹们 我恋爱了"
        },
        {
          "mine": true,
          "text": "??? 详细说"
        },
        {
          "mine": false,
          "text": "就上次那个"
        },
        {
          "mine": true,
          "text": "啊啊啊 快发照片"
        },
        {
          "mine": false,
          "text": "害羞 晚点"
        }
      ]
    },
    {
      "name": "球队",
      "messages": [
        {
          "mine": true,
          "text": "周六几点集合"
        },
        {
          "mine": false,
          "text": "八点半 别迟到"
        },
        {
          "mine": true,
          "text": "上次谁没来"
        },
        {
          "mine": false,
          "text": "大熊 罚他请喝水"
        },
        {
          "mine": true,
          "text": "哈哈活该"
        }
      ]
    },
    {
      "name": "死党",
      "messages": [
        {
          "mine": false,
          "text": "在吗"
        },
        {
          "mine": true,
          "text": "在 咋了"
        },
        {
          "mine": false,
          "text": "没事就想问问"
        },
        {
          "mine": true,
          "text": "有病哈哈"
        },
        {
          "mine": false,
          "text": "想你了呗"
        }
      ]
    },
    {
      "name": "小美 ❤️",
      "messages": [
        {
          "mine": true,
          "text": "今天路过看到一只超像你的猫"
        },
        {
          "mine": false,
          "text": "凭啥像我"
        },
        {
          "mine": true,
          "text": "圆脸 凶巴巴"
        },
        {
          "mine": false,
          "text": "你完了"
        },
        {
          "mine": true,
          "text": "开玩笑的 超可爱那种"
        }
      ]
    },
    {
      "name": "阿强",
      "messages": [
        {
          "mine": false,
          "text": "钱我转你了"
        },
        {
          "mine": true,
          "text": "收到 多退少补哈"
        },
        {
          "mine": false,
          "text": "客气啥"
        },
        {
          "mine": true,
          "text": "下次我请"
        }
      ]
    },
    {
      "name": "露露",
      "messages": [
        {
          "mine": true,
          "text": "你那件外套哪买的"
        },
        {
          "mine": false,
          "text": "商场里的 忘了牌子"
        },
        {
          "mine": true,
          "text": "帮我拍个吊牌"
        },
        {
          "mine": false,
          "text": "行 等我回家"
        }
      ]
    },
    {
      "name": "大鹏",
      "messages": [
        {
          "mine": false,
          "text": "今晚开黑不"
        },
        {
          "mine": true,
          "text": "几点"
        },
        {
          "mine": false,
          "text": "九点"
        },
        {
          "mine": true,
          "text": "行 我先吃饭"
        },
        {
          "mine": false,
          "text": "快点 就差你了"
        }
      ]
    },
    {
      "name": "雯雯",
      "messages": [
        {
          "mine": false,
          "text": "我emo了"
        },
        {
          "mine": true,
          "text": "又咋了"
        },
        {
          "mine": false,
          "text": "工作好烦"
        },
        {
          "mine": true,
          "text": "下班喝一杯？"
        },
        {
          "mine": false,
          "text": "好 我需要"
        }
      ]
    },
    {
      "name": "老王",
      "messages": [
        {
          "mine": true,
          "text": "那本书还我没"
        },
        {
          "mine": false,
          "text": "啊 我忘带了"
        },
        {
          "mine": true,
          "text": "又忘"
        },
        {
          "mine": false,
          "text": "明天必带 真的"
        }
      ]
    },
    {
      "name": "娜娜",
      "messages": [
        {
          "mine": false,
          "text": "你猜我今天遇到谁了"
        },
        {
          "mine": true,
          "text": "谁"
        },
        {
          "mine": false,
          "text": "咱高中班长"
        },
        {
          "mine": true,
          "text": "啊 他现在咋样"
        },
        {
          "mine": false,
          "text": "胖了一圈哈哈哈"
        }
      ]
    },
    {
      "name": "阿杰",
      "messages": [
        {
          "mine": true,
          "text": "帮我个忙"
        },
        {
          "mine": false,
          "text": "说"
        },
        {
          "mine": true,
          "text": "周末帮我搬个家"
        },
        {
          "mine": false,
          "text": "行 管饭不"
        },
        {
          "mine": true,
          "text": "管 还有奶茶"
        }
      ]
    },
    {
      "name": "甜甜",
      "messages": [
        {
          "mine": false,
          "text": "睡了吗"
        },
        {
          "mine": true,
          "text": "没 咋了"
        },
        {
          "mine": false,
          "text": "睡不着"
        },
        {
          "mine": true,
          "text": "数羊"
        },
        {
          "mine": false,
          "text": "数到两百了"
        }
      ]
    },
    {
      "name": "小凯",
      "messages": [
        {
          "mine": true,
          "text": "作业你写了吗"
        },
        {
          "mine": false,
          "text": "哪个作业"
        },
        {
          "mine": true,
          "text": "完了 你也没写"
        },
        {
          "mine": false,
          "text": "抄一下你的"
        },
        {
          "mine": true,
          "text": "我还没写呢急死"
        }
      ]
    },
    {
      "name": "晨晨",
      "messages": [
        {
          "mine": false,
          "text": "早"
        },
        {
          "mine": true,
          "text": "早 这么早"
        },
        {
          "mine": false,
          "text": "被楼上吵醒了"
        },
        {
          "mine": true,
          "text": "惨 我还想赖床"
        }
      ]
    },
    {
      "name": "阿福",
      "messages": [
        {
          "mine": false,
          "text": "约会回来了"
        },
        {
          "mine": true,
          "text": "咋样咋样"
        },
        {
          "mine": false,
          "text": "还行吧"
        },
        {
          "mine": true,
          "text": "就还行？"
        },
        {
          "mine": false,
          "text": "别问了 一言难尽"
        }
      ]
    },
    {
      "name": "悦悦",
      "messages": [
        {
          "mine": true,
          "text": "你那个口红色号"
        },
        {
          "mine": false,
          "text": "豆沙那个吗"
        },
        {
          "mine": true,
          "text": "对"
        },
        {
          "mine": false,
          "text": "回头发你截图"
        },
        {
          "mine": true,
          "text": "谢啦亲"
        }
      ]
    },
    {
      "name": "子豪",
      "messages": [
        {
          "mine": false,
          "text": "球赛看了吗"
        },
        {
          "mine": true,
          "text": "看了 太气了"
        },
        {
          "mine": false,
          "text": "最后那球离谱"
        },
        {
          "mine": true,
          "text": "裁判有问题"
        },
        {
          "mine": false,
          "text": "算了 下次"
        }
      ]
    },
    {
      "name": "妞妞",
      "messages": [
        {
          "mine": false,
          "text": "在忙吗"
        },
        {
          "mine": true,
          "text": "还好 说"
        },
        {
          "mine": false,
          "text": "陪我去逛街嘛"
        },
        {
          "mine": true,
          "text": "现在？"
        },
        {
          "mine": false,
          "text": "对 我在楼下了"
        },
        {
          "mine": true,
          "text": "啊等我 我还没洗头"
        }
      ]
    },
    {
      "name": "阿哲",
      "messages": [
        {
          "mine": true,
          "text": "那家店关门了"
        },
        {
          "mine": false,
          "text": "啊 真的假的"
        },
        {
          "mine": true,
          "text": "刚路过 拉闸了"
        },
        {
          "mine": false,
          "text": "可惜 挺好吃的"
        }
      ]
    },
    {
      "name": "珊珊",
      "messages": [
        {
          "mine": false,
          "text": "生日想要啥"
        },
        {
          "mine": true,
          "text": "你记得我生日啊"
        },
        {
          "mine": false,
          "text": "废话"
        },
        {
          "mine": true,
          "text": "有心就行 别破费"
        },
        {
          "mine": false,
          "text": "少来 说吧"
        }
      ]
    },
    {
      "name": "小马",
      "messages": [
        {
          "mine": false,
          "text": "帮我带杯咖啡"
        },
        {
          "mine": true,
          "text": "你在公司？"
        },
        {
          "mine": false,
          "text": "对 困死了"
        },
        {
          "mine": true,
          "text": "行 老样子"
        },
        {
          "mine": false,
          "text": "谢救命"
        }
      ]
    },
    {
      "name": "佳佳",
      "messages": [
        {
          "mine": true,
          "text": "周末电影？"
        },
        {
          "mine": false,
          "text": "看啥"
        },
        {
          "mine": true,
          "text": "那个新出的"
        },
        {
          "mine": false,
          "text": "好 你订票"
        },
        {
          "mine": true,
          "text": "行 靠后排？"
        },
        {
          "mine": false,
          "text": "嗯嗯"
        }
      ]
    },
    {
      "name": "阿龙",
      "messages": [
        {
          "mine": false,
          "text": "到哪了"
        },
        {
          "mine": true,
          "text": "堵车 别催"
        },
        {
          "mine": false,
          "text": "菜都凉了"
        },
        {
          "mine": true,
          "text": "马上到 五分钟"
        }
      ]
    },
    {
      "name": "静静",
      "messages": [
        {
          "mine": false,
          "text": "今天真的谢谢你"
        },
        {
          "mine": true,
          "text": "客气啥"
        },
        {
          "mine": false,
          "text": "关键时候还是你"
        },
        {
          "mine": true,
          "text": "都是姐妹 别矫情"
        }
      ]
    },
    {
      "name": "小北",
      "messages": [
        {
          "mine": true,
          "text": "在干嘛呢"
        },
        {
          "mine": false,
          "text": "躺尸"
        },
        {
          "mine": true,
          "text": "一起 我也躺"
        },
        {
          "mine": false,
          "text": "哈哈哈无聊二人组"
        }
      ]
    },
    {
      "name": "果果",
      "messages": [
        {
          "mine": false,
          "text": "我减肥失败了"
        },
        {
          "mine": true,
          "text": "又吃了？"
        },
        {
          "mine": false,
          "text": "一整个蛋糕"
        },
        {
          "mine": true,
          "text": "笑死 明天再减"
        },
        {
          "mine": false,
          "text": "明天的事明天说"
        }
      ]
    },
    {
      "name": "阿俊",
      "messages": [
        {
          "mine": true,
          "text": "那个文件你看了吗"
        },
        {
          "mine": false,
          "text": "没 等下看"
        },
        {
          "mine": true,
          "text": "急用"
        },
        {
          "mine": false,
          "text": "好 马上"
        }
      ]
    },
    {
      "name": "莉莉",
      "messages": [
        {
          "mine": false,
          "text": "分享个好消息"
        },
        {
          "mine": true,
          "text": "说说"
        },
        {
          "mine": false,
          "text": "我升职了"
        },
        {
          "mine": true,
          "text": "牛啊 请客请客"
        },
        {
          "mine": false,
          "text": "必须的"
        }
      ]
    },
    {
      "name": "小四",
      "messages": [
        {
          "mine": false,
          "text": "在不"
        },
        {
          "mine": true,
          "text": "在"
        },
        {
          "mine": false,
          "text": "借我五十 明天还"
        },
        {
          "mine": true,
          "text": "转你了"
        },
        {
          "mine": false,
          "text": "爱你"
        }
      ]
    },
    {
      "name": "圆圆",
      "messages": [
        {
          "mine": true,
          "text": "你家猫又拆家了？"
        },
        {
          "mine": false,
          "text": "对 沙发废了"
        },
        {
          "mine": true,
          "text": "哈哈哈哈报应"
        },
        {
          "mine": false,
          "text": "别笑 你养一个试试"
        }
      ]
    },
    {
      "name": "阿凯",
      "messages": [
        {
          "mine": false,
          "text": "周五团建去哪"
        },
        {
          "mine": true,
          "text": "还没定"
        },
        {
          "mine": false,
          "text": "投票了投烧烤"
        },
        {
          "mine": true,
          "text": "行 我也想吃"
        }
      ]
    },
    {
      "name": "楠楠",
      "messages": [
        {
          "mine": false,
          "text": "我裂开了"
        },
        {
          "mine": true,
          "text": "咋了"
        },
        {
          "mine": false,
          "text": "手机摔了 屏碎了"
        },
        {
          "mine": true,
          "text": "心疼 修得贵不"
        },
        {
          "mine": false,
          "text": "别提了"
        }
      ]
    },
    {
      "name": "小胖",
      "messages": [
        {
          "mine": true,
          "text": "减肥进度如何"
        },
        {
          "mine": false,
          "text": "别哪壶不开提哪壶"
        },
        {
          "mine": true,
          "text": "哈哈哈"
        },
        {
          "mine": false,
          "text": "今天开始 真的"
        }
      ]
    },
    {
      "name": "蕾蕾",
      "messages": [
        {
          "mine": false,
          "text": "晚安"
        },
        {
          "mine": true,
          "text": "这么早？"
        },
        {
          "mine": false,
          "text": "太累了 先睡了"
        },
        {
          "mine": true,
          "text": "好 做个好梦"
        }
      ]
    },
    {
      "name": "阿磊",
      "messages": [
        {
          "mine": false,
          "text": "车借我用一天呗"
        },
        {
          "mine": true,
          "text": "干嘛"
        },
        {
          "mine": false,
          "text": "去接我爸妈"
        },
        {
          "mine": true,
          "text": "行 钥匙在老地方"
        },
        {
          "mine": false,
          "text": "谢啦兄弟"
        }
      ]
    },
    {
      "name": "沫沫",
      "messages": [
        {
          "mine": true,
          "text": "你上次说的那个面膜"
        },
        {
          "mine": false,
          "text": "咋了 好用吧"
        },
        {
          "mine": true,
          "text": "绝了 回购"
        },
        {
          "mine": false,
          "text": "早说了吧哈哈"
        }
      ]
    },
    {
      "name": "小天",
      "messages": [
        {
          "mine": false,
          "text": "在线吗"
        },
        {
          "mine": true,
          "text": "在"
        },
        {
          "mine": false,
          "text": "帮我看下这题"
        },
        {
          "mine": true,
          "text": "拍照发我"
        },
        {
          "mine": false,
          "text": "稍等"
        }
      ]
    },
    {
      "name": "欣欣",
      "messages": [
        {
          "mine": false,
          "text": "好想吃火锅啊"
        },
        {
          "mine": true,
          "text": "现在？"
        },
        {
          "mine": false,
          "text": "对 陪我"
        },
        {
          "mine": true,
          "text": "行 半小时后楼下"
        },
        {
          "mine": false,
          "text": "冲"
        }
      ]
    },
    {
      "name": "阿超",
      "messages": [
        {
          "mine": true,
          "text": "周末回老家不"
        },
        {
          "mine": false,
          "text": "回 你也回？"
        },
        {
          "mine": true,
          "text": "对 一起坐高铁"
        },
        {
          "mine": false,
          "text": "好 买你旁边"
        }
      ]
    },
    {
      "name": "丹丹",
      "messages": [
        {
          "mine": false,
          "text": "我发型翻车了"
        },
        {
          "mine": true,
          "text": "又剪短了？"
        },
        {
          "mine": false,
          "text": "对 又是"
        },
        {
          "mine": true,
          "text": "你咋总这样哈哈"
        },
        {
          "mine": false,
          "text": "不理你了"
        }
      ]
    },
    {
      "name": "小鱼",
      "messages": [
        {
          "mine": false,
          "text": "在吗在吗"
        },
        {
          "mine": true,
          "text": "在 急啥"
        },
        {
          "mine": false,
          "text": "跟你说个八卦"
        },
        {
          "mine": true,
          "text": "快说"
        },
        {
          "mine": false,
          "text": "打电话 打字太慢"
        }
      ]
    },
    {
      "name": "涛涛",
      "messages": [
        {
          "mine": true,
          "text": "球鞋到了没"
        },
        {
          "mine": false,
          "text": "到了 巨好看"
        },
        {
          "mine": true,
          "text": "拍张"
        },
        {
          "mine": false,
          "text": "等下发你"
        }
      ]
    },
    {
      "name": "兔子",
      "messages": [
        {
          "mine": false,
          "text": "困死了"
        },
        {
          "mine": true,
          "text": "那睡呗"
        },
        {
          "mine": false,
          "text": "舍不得睡"
        },
        {
          "mine": true,
          "text": "神经 快睡"
        }
      ]
    },
    {
      "name": "阿明",
      "messages": [
        {
          "mine": false,
          "text": "明天有空不"
        },
        {
          "mine": true,
          "text": "有 咋"
        },
        {
          "mine": false,
          "text": "陪我去挑礼物"
        },
        {
          "mine": true,
          "text": "给谁的"
        },
        {
          "mine": false,
          "text": "我妈生日"
        }
      ]
    },
    {
      "name": "芳芳",
      "messages": [
        {
          "mine": true,
          "text": "你到哪了"
        },
        {
          "mine": false,
          "text": "刚出门"
        },
        {
          "mine": true,
          "text": "慢死了"
        },
        {
          "mine": false,
          "text": "马上马上"
        }
      ]
    },
    {
      "name": "小七",
      "messages": [
        {
          "mine": false,
          "text": "我今天面试"
        },
        {
          "mine": true,
          "text": "加油！稳住"
        },
        {
          "mine": false,
          "text": "有点慌"
        },
        {
          "mine": true,
          "text": "你可以的 别怕"
        },
        {
          "mine": false,
          "text": "谢啦 等我好消息"
        }
      ]
    },
    {
      "name": "亮亮",
      "messages": [
        {
          "mine": false,
          "text": "游戏更新了"
        },
        {
          "mine": true,
          "text": "又更新 好烦"
        },
        {
          "mine": false,
          "text": "新皮肤挺好看"
        },
        {
          "mine": true,
          "text": "买不起 告辞"
        }
      ]
    },
    {
      "name": "猫猫",
      "messages": [
        {
          "mine": true,
          "text": "在干嘛"
        },
        {
          "mine": false,
          "text": "撸猫"
        },
        {
          "mine": true,
          "text": "又撸 你不上班的？"
        },
        {
          "mine": false,
          "text": "周末啊大哥"
        }
      ]
    },
    {
      "name": "阿健",
      "messages": [
        {
          "mine": false,
          "text": "健身去不"
        },
        {
          "mine": true,
          "text": "今天腿疼"
        },
        {
          "mine": false,
          "text": "借口"
        },
        {
          "mine": true,
          "text": "真的 昨天练腿了"
        },
        {
          "mine": false,
          "text": "行吧 那明天"
        }
      ]
    },
    {
      "name": "玲玲 高中",
      "messages": [
        {
          "mine": false,
          "text": "同学聚会你去吗"
        },
        {
          "mine": true,
          "text": "看什么时候"
        },
        {
          "mine": false,
          "text": "下个月十五"
        },
        {
          "mine": true,
          "text": "那天应该有空 去"
        },
        {
          "mine": false,
          "text": "好 到时候拉群"
        }
      ]
    },
    {
      "name": "小柯 健身房",
      "messages": [
        {
          "mine": true,
          "text": "今天几点去"
        },
        {
          "mine": false,
          "text": "晚上七点"
        },
        {
          "mine": true,
          "text": "行 一起练背"
        },
        {
          "mine": false,
          "text": "好 别放我鸽子"
        }
      ]
    },
    {
      "name": "乐乐",
      "messages": [
        {
          "mine": false,
          "text": "无聊"
        },
        {
          "mine": true,
          "text": "陪我聊会"
        },
        {
          "mine": false,
          "text": "聊啥"
        },
        {
          "mine": true,
          "text": "随便 反正无聊"
        },
        {
          "mine": false,
          "text": "那我给你讲个笑话"
        }
      ]
    },
    {
      "name": "阿斌",
      "messages": [
        {
          "mine": false,
          "text": "钱到账了"
        },
        {
          "mine": true,
          "text": "好 收到"
        },
        {
          "mine": false,
          "text": "还差点利息哈哈"
        },
        {
          "mine": true,
          "text": "滚 想得美"
        }
      ]
    },
    {
      "name": "琪琪",
      "messages": [
        {
          "mine": true,
          "text": "周末去海边吗"
        },
        {
          "mine": false,
          "text": "好啊 谁开车"
        },
        {
          "mine": true,
          "text": "我开"
        },
        {
          "mine": false,
          "text": "那我带吃的"
        },
        {
          "mine": true,
          "text": "完美"
        }
      ]
    },
    {
      "name": "小林",
      "messages": [
        {
          "mine": false,
          "text": "作业交了没"
        },
        {
          "mine": true,
          "text": "交了 你呢"
        },
        {
          "mine": false,
          "text": "还没写完 救命"
        },
        {
          "mine": true,
          "text": "快写 要截止了"
        }
      ]
    },
    {
      "name": "田田",
      "messages": [
        {
          "mine": false,
          "text": "今天心情好好"
        },
        {
          "mine": true,
          "text": "咋了 中彩票了"
        },
        {
          "mine": false,
          "text": "没 就天气好"
        },
        {
          "mine": true,
          "text": "你也太容易满足了哈哈"
        }
      ]
    },
    {
      "name": "阿浩",
      "messages": [
        {
          "mine": true,
          "text": "老地方？"
        },
        {
          "mine": false,
          "text": "行 几点"
        },
        {
          "mine": true,
          "text": "六点半"
        },
        {
          "mine": false,
          "text": "好 我先去"
        }
      ]
    },
    {
      "name": "梦梦",
      "messages": [
        {
          "mine": false,
          "text": "睡不着"
        },
        {
          "mine": true,
          "text": "又刷手机了吧"
        },
        {
          "mine": false,
          "text": "被你发现"
        },
        {
          "mine": true,
          "text": "放下手机 闭眼"
        }
      ]
    },
    {
      "name": "小雷",
      "messages": [
        {
          "mine": false,
          "text": "在吗 有事求助"
        },
        {
          "mine": true,
          "text": "说"
        },
        {
          "mine": false,
          "text": "电脑蓝屏了"
        },
        {
          "mine": true,
          "text": "重启试试"
        },
        {
          "mine": false,
          "text": "试了没用 完蛋"
        }
      ]
    },
    {
      "name": "燕子",
      "messages": [
        {
          "mine": true,
          "text": "你今天穿得好好看"
        },
        {
          "mine": false,
          "text": "嘿嘿看出来了"
        },
        {
          "mine": true,
          "text": "去约会了？"
        },
        {
          "mine": false,
          "text": "被你猜到了"
        }
      ]
    },
    {
      "name": "阿东",
      "messages": [
        {
          "mine": false,
          "text": "球票抢到了"
        },
        {
          "mine": true,
          "text": "牛 几张"
        },
        {
          "mine": false,
          "text": "两张 带你"
        },
        {
          "mine": true,
          "text": "爱你兄弟"
        }
      ]
    },
    {
      "name": "微微",
      "messages": [
        {
          "mine": false,
          "text": "今天好累"
        },
        {
          "mine": true,
          "text": "早点睡"
        },
        {
          "mine": false,
          "text": "还有一堆事"
        },
        {
          "mine": true,
          "text": "悠着点 身体要紧"
        }
      ]
    },
    {
      "name": "小九",
      "messages": [
        {
          "mine": true,
          "text": "在忙吗"
        },
        {
          "mine": false,
          "text": "还好"
        },
        {
          "mine": true,
          "text": "帮我看个东西"
        },
        {
          "mine": false,
          "text": "发来"
        },
        {
          "mine": true,
          "text": "稍等"
        }
      ]
    },
    {
      "name": "桃子",
      "messages": [
        {
          "mine": false,
          "text": "我买了新裙子"
        },
        {
          "mine": true,
          "text": "又买"
        },
        {
          "mine": false,
          "text": "这次真好看 你看"
        },
        {
          "mine": true,
          "text": "确实 多少钱"
        },
        {
          "mine": false,
          "text": "不告诉你哈哈"
        }
      ]
    },
    {
      "name": "阿轩",
      "messages": [
        {
          "mine": false,
          "text": "晚上打球不"
        },
        {
          "mine": true,
          "text": "下雨呢"
        },
        {
          "mine": false,
          "text": "室内场"
        },
        {
          "mine": true,
          "text": "行 几号场"
        },
        {
          "mine": false,
          "text": "三号"
        }
      ]
    },
    {
      "name": "盈盈",
      "messages": [
        {
          "mine": true,
          "text": "生理期疼死了"
        },
        {
          "mine": false,
          "text": "多喝热水"
        },
        {
          "mine": true,
          "text": "你个直男"
        },
        {
          "mine": false,
          "text": "哈哈那我给你送红糖水"
        }
      ]
    },
    {
      "name": "小敏",
      "messages": [
        {
          "mine": false,
          "text": "周末有安排没"
        },
        {
          "mine": true,
          "text": "没 咋"
        },
        {
          "mine": false,
          "text": "一起去逛市集"
        },
        {
          "mine": true,
          "text": "好啊 几点"
        },
        {
          "mine": false,
          "text": "上午十点"
        }
      ]
    },
    {
      "name": "皮皮",
      "messages": [
        {
          "mine": true,
          "text": "你家狗会握手了？"
        },
        {
          "mine": false,
          "text": "对 教了一周"
        },
        {
          "mine": true,
          "text": "厉害了 视频呢"
        },
        {
          "mine": false,
          "text": "发你了 看"
        }
      ]
    },
    {
      "name": "阿康",
      "messages": [
        {
          "mine": false,
          "text": "借你充电器用下"
        },
        {
          "mine": true,
          "text": "在我桌上 自己拿"
        },
        {
          "mine": false,
          "text": "找不到"
        },
        {
          "mine": true,
          "text": "抽屉里"
        }
      ]
    },
    {
      "name": "岚岚",
      "messages": [
        {
          "mine": false,
          "text": "好久不见"
        },
        {
          "mine": true,
          "text": "是啊 想你了"
        },
        {
          "mine": false,
          "text": "啥时候回来"
        },
        {
          "mine": true,
          "text": "过年吧"
        },
        {
          "mine": false,
          "text": "那么久 等你"
        }
      ]
    },
    {
      "name": "大熊",
      "messages": [
        {
          "mine": true,
          "text": "上次踢球罚你请喝水"
        },
        {
          "mine": false,
          "text": "又是我"
        },
        {
          "mine": true,
          "text": "谁让你没来"
        },
        {
          "mine": false,
          "text": "行行行 我请"
        }
      ]
    },
    {
      "name": "糖糖",
      "messages": [
        {
          "mine": false,
          "text": "我今天做了蛋糕"
        },
        {
          "mine": true,
          "text": "自己做的？"
        },
        {
          "mine": false,
          "text": "对 卖相一言难尽"
        },
        {
          "mine": true,
          "text": "哈哈哈发我看看"
        },
        {
          "mine": false,
          "text": "算了 太丑"
        }
      ]
    },
    {
      "name": "阿泽",
      "messages": [
        {
          "mine": false,
          "text": "周末一起自习不"
        },
        {
          "mine": true,
          "text": "行 图书馆？"
        },
        {
          "mine": false,
          "text": "对 老位置"
        },
        {
          "mine": true,
          "text": "好 我占座"
        }
      ]
    },
    {
      "name": "婕婕",
      "messages": [
        {
          "mine": true,
          "text": "你那个电视剧看到哪了"
        },
        {
          "mine": false,
          "text": "刚看完大结局"
        },
        {
          "mine": true,
          "text": "别剧透！"
        },
        {
          "mine": false,
          "text": "哈哈憋死我了"
        }
      ]
    },
    {
      "name": "小舟",
      "messages": [
        {
          "mine": false,
          "text": "在吗"
        },
        {
          "mine": true,
          "text": "在"
        },
        {
          "mine": false,
          "text": "没事 就想有个人回我"
        },
        {
          "mine": true,
          "text": "我一直在啊"
        }
      ]
    },
    {
      "name": "豆豆",
      "messages": [
        {
          "mine": false,
          "text": "晚上吃啥"
        },
        {
          "mine": true,
          "text": "点外卖吧"
        },
        {
          "mine": false,
          "text": "又外卖 腻了"
        },
        {
          "mine": true,
          "text": "那你做"
        },
        {
          "mine": false,
          "text": "算了还是外卖"
        }
      ]
    },
    {
      "name": "阿铭",
      "messages": [
        {
          "mine": true,
          "text": "周末搬砖 帮我一把？"
        },
        {
          "mine": false,
          "text": "又搬家？"
        },
        {
          "mine": true,
          "text": "对 换个大点的"
        },
        {
          "mine": false,
          "text": "行 管饭就去"
        }
      ]
    },
    {
      "name": "溪溪",
      "messages": [
        {
          "mine": false,
          "text": "今天下雨没带伞"
        },
        {
          "mine": true,
          "text": "淋成落汤鸡了？"
        },
        {
          "mine": false,
          "text": "对 冷死"
        },
        {
          "mine": true,
          "text": "快回家泡个热水澡"
        }
      ]
    },
    {
      "name": "大力",
      "messages": [
        {
          "mine": false,
          "text": "健身餐做好了"
        },
        {
          "mine": true,
          "text": "又鸡胸肉？"
        },
        {
          "mine": false,
          "text": "对 香得很"
        },
        {
          "mine": true,
          "text": "你是真自律"
        }
      ]
    },
    {
      "name": "花花",
      "messages": [
        {
          "mine": true,
          "text": "周末干嘛"
        },
        {
          "mine": false,
          "text": "在家躺"
        },
        {
          "mine": true,
          "text": "出来玩嘛"
        },
        {
          "mine": false,
          "text": "不想动"
        },
        {
          "mine": true,
          "text": "懒猪"
        }
      ]
    },
    {
      "name": "阿嘉",
      "messages": [
        {
          "mine": false,
          "text": "那事定了吗"
        },
        {
          "mine": true,
          "text": "定了 周六"
        },
        {
          "mine": false,
          "text": "好 我记下"
        },
        {
          "mine": true,
          "text": "别忘了"
        }
      ]
    },
    {
      "name": "星星",
      "messages": [
        {
          "mine": false,
          "text": "今晚看星星不"
        },
        {
          "mine": true,
          "text": "去哪看"
        },
        {
          "mine": false,
          "text": "山顶 我知道个地方"
        },
        {
          "mine": true,
          "text": "好浪漫 走"
        },
        {
          "mine": false,
          "text": "带件外套"
        }
      ]
    },
    {
      "name": "小满",
      "messages": [
        {
          "mine": false,
          "text": "考试考砸了"
        },
        {
          "mine": true,
          "text": "没事 下次再来"
        },
        {
          "mine": false,
          "text": "心态崩了"
        },
        {
          "mine": true,
          "text": "出来吃点好的 我请"
        },
        {
          "mine": false,
          "text": "呜呜谢谢你"
        }
      ]
    },
    {
      "name": "姐妹淘",
      "messages": [
        {
          "mine": false,
          "text": "周末谁有空"
        },
        {
          "mine": true,
          "text": "我有"
        },
        {
          "mine": false,
          "text": "去做美甲不"
        },
        {
          "mine": true,
          "text": "去去去"
        },
        {
          "mine": false,
          "text": "那约起"
        }
      ]
    },
    {
      "name": "饭搭子",
      "messages": [
        {
          "mine": false,
          "text": "中午吃啥"
        },
        {
          "mine": true,
          "text": "楼下那家？"
        },
        {
          "mine": false,
          "text": "吃腻了"
        },
        {
          "mine": true,
          "text": "那换隔壁的"
        },
        {
          "mine": false,
          "text": "行 十二点见"
        }
      ]
    }
  ],
};
