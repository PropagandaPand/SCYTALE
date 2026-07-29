/**
 * Believable, mundane fake chat content for seeding the DECOY account (see decoySeed.ts). Purely
 * innocuous everyday small talk, localized so the decoy matches the app language. NOTHING here is
 * secret or sensitive — it is cover material a coercer is meant to browse and find boring. A missing
 * language falls back to en (decoySeed.ts). Generated content; edit via that flow, not by hand.
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
          "text": "hast du an omas geburtstag gedacht? ist samstag"
        },
        {
          "mine": true,
          "text": "ja hab ich, wollte ihr blumen mitbringen"
        },
        {
          "mine": false,
          "text": "schön. kommst du zum kaffee oder erst zum essen?"
        },
        {
          "mine": true,
          "text": "eher zum kaffee, muss vormittags noch was erledigen"
        },
        {
          "mine": false,
          "text": "ok. soll ich dir was zu essen einpacken für die woche?"
        },
        {
          "mine": true,
          "text": "gerne, dein gulasch wenn noch was da ist 😄"
        },
        {
          "mine": false,
          "text": "mach ich. bis samstag!"
        },
        {
          "mine": true,
          "text": "bis samstag, drück euch"
        }
      ]
    },
    {
      "name": "Lukas",
      "messages": [
        {
          "mine": false,
          "text": "sind wir morgen noch beim training?"
        },
        {
          "mine": true,
          "text": "jup 18 uhr halle 2 wie immer"
        },
        {
          "mine": false,
          "text": "top. kannst du mich mitnehmen? mein rad hat platten"
        },
        {
          "mine": true,
          "text": "klar, bin um viertel vor bei dir"
        },
        {
          "mine": false,
          "text": "perfekt danke dir"
        },
        {
          "mine": true,
          "text": "kein ding. bring bloß deine hallenschuhe mit diesmal 😅"
        },
        {
          "mine": false,
          "text": "haha ja ja"
        }
      ]
    },
    {
      "name": "Sarah B.",
      "messages": [
        {
          "mine": true,
          "text": "hey hast du die folien für montag schon?"
        },
        {
          "mine": false,
          "text": "bin fast durch, schick sie dir heute abend"
        },
        {
          "mine": true,
          "text": "super kein stress. muss nur die zahlen vom q2 noch prüfen"
        },
        {
          "mine": false,
          "text": "die hab ich dir gestern in den ordner gelegt"
        },
        {
          "mine": true,
          "text": "ah stimmt gefunden danke"
        },
        {
          "mine": false,
          "text": "gerne. dann bis montag im meeting"
        },
        {
          "mine": true,
          "text": "jap schönen abend noch"
        }
      ]
    },
    {
      "name": "Handwerker Meier",
      "messages": [
        {
          "mine": true,
          "text": "guten tag, passt es morgen um 9 wegen der heizung?"
        },
        {
          "mine": false,
          "text": "morgen wird knapp, ginge auch donnerstag 8 uhr?"
        },
        {
          "mine": true,
          "text": "donnerstag geht klar"
        },
        {
          "mine": false,
          "text": "gut, ich bring das ersatzteil gleich mit"
        },
        {
          "mine": true,
          "text": "prima, dann bis donnerstag"
        },
        {
          "mine": false,
          "text": "bis dann"
        }
      ]
    },
    {
      "name": "Jonas",
      "messages": [
        {
          "mine": false,
          "text": "wochenende schon was vor?"
        },
        {
          "mine": true,
          "text": "noch nix fest, warum?"
        },
        {
          "mine": false,
          "text": "wollte grillen wenn das wetter hält"
        },
        {
          "mine": true,
          "text": "bin dabei, bring salat mit"
        },
        {
          "mine": false,
          "text": "nice. so ab 4 bei mir im garten"
        },
        {
          "mine": true,
          "text": "passt. soll ich noch kohle besorgen?"
        },
        {
          "mine": false,
          "text": "hab genug, bring lieber was zu trinken"
        },
        {
          "mine": true,
          "text": "geht klar bis samstag"
        }
      ]
    }
  ],
  "en": [
    {
      "name": "Mum",
      "messages": [
        {
          "mine": false,
          "text": "did the parcel arrive yet?"
        },
        {
          "mine": true,
          "text": "not yet, tracking says out for delivery today"
        },
        {
          "mine": false,
          "text": "ok let me know when it turns up"
        },
        {
          "mine": true,
          "text": "will do. how was your appointment?"
        },
        {
          "mine": false,
          "text": "fine, all clear, just tired after"
        },
        {
          "mine": true,
          "text": "good to hear. get some rest x"
        },
        {
          "mine": false,
          "text": "thanks love, talk later"
        }
      ]
    },
    {
      "name": "Dan",
      "messages": [
        {
          "mine": true,
          "text": "still on for the match sunday?"
        },
        {
          "mine": false,
          "text": "yeah kickoff is 2 right?"
        },
        {
          "mine": true,
          "text": "2:15 actually, i'll grab seats"
        },
        {
          "mine": false,
          "text": "cheers. i'll sort the drinks after"
        },
        {
          "mine": true,
          "text": "sounds good. meet outside the north gate?"
        },
        {
          "mine": false,
          "text": "perfect see you there"
        }
      ]
    },
    {
      "name": "Priya",
      "messages": [
        {
          "mine": false,
          "text": "did you get the file i sent?"
        },
        {
          "mine": true,
          "text": "yep got it, opening now"
        },
        {
          "mine": false,
          "text": "the last tab has the updated numbers"
        },
        {
          "mine": true,
          "text": "great, that's what i needed. thanks"
        },
        {
          "mine": false,
          "text": "no worries. can you send it back once you've reviewed?"
        },
        {
          "mine": true,
          "text": "sure, by end of day"
        },
        {
          "mine": false,
          "text": "perfect ta"
        }
      ]
    },
    {
      "name": "Dentist",
      "messages": [
        {
          "mine": false,
          "text": "reminder: your check-up is booked for tue 10:30"
        },
        {
          "mine": true,
          "text": "thanks, could we push it a bit later? maybe 11?"
        },
        {
          "mine": false,
          "text": "we can do 11:15, does that work?"
        },
        {
          "mine": true,
          "text": "that's perfect, thank you"
        },
        {
          "mine": false,
          "text": "great, see you tuesday"
        },
        {
          "mine": true,
          "text": "see you then"
        }
      ]
    },
    {
      "name": "Emma",
      "messages": [
        {
          "mine": true,
          "text": "running about 10 min late sorry!"
        },
        {
          "mine": false,
          "text": "no stress, i'll grab us a table"
        },
        {
          "mine": true,
          "text": "you're a star. order me a flat white?"
        },
        {
          "mine": false,
          "text": "done. by the window as usual"
        },
        {
          "mine": true,
          "text": "perfect nearly there"
        },
        {
          "mine": false,
          "text": "take your time"
        },
        {
          "mine": true,
          "text": "walking in now 🙂"
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
          "text": "vienes a comer el domingo?"
        },
        {
          "mine": true,
          "text": "sí claro, a qué hora?"
        },
        {
          "mine": false,
          "text": "sobre las dos, hago paella"
        },
        {
          "mine": true,
          "text": "qué bien, llevo el postre"
        },
        {
          "mine": false,
          "text": "vale hijo, no llegues tarde"
        },
        {
          "mine": true,
          "text": "tranquila, ahí estaré. un beso"
        },
        {
          "mine": false,
          "text": "otro para ti"
        }
      ]
    },
    {
      "name": "Carlos",
      "messages": [
        {
          "mine": true,
          "text": "oye seguimos con lo del partido mañana?"
        },
        {
          "mine": false,
          "text": "sí a las seis en el campo de siempre"
        },
        {
          "mine": true,
          "text": "vale te recojo?"
        },
        {
          "mine": false,
          "text": "genial, a las cinco y media"
        },
        {
          "mine": true,
          "text": "hecho, no olvides las botas"
        },
        {
          "mine": false,
          "text": "jaja esta vez sí, tranqui"
        }
      ]
    },
    {
      "name": "Lucía",
      "messages": [
        {
          "mine": false,
          "text": "te llegó el archivo del informe?"
        },
        {
          "mine": true,
          "text": "sí, lo estoy mirando ahora"
        },
        {
          "mine": false,
          "text": "los datos nuevos están en la última hoja"
        },
        {
          "mine": true,
          "text": "perfecto era justo eso, gracias"
        },
        {
          "mine": false,
          "text": "de nada, me lo devuelves cuando puedas"
        },
        {
          "mine": true,
          "text": "esta tarde sin falta"
        }
      ]
    },
    {
      "name": "Casero",
      "messages": [
        {
          "mine": true,
          "text": "buenas, el grifo de la cocina sigue goteando"
        },
        {
          "mine": false,
          "text": "vaya, mando al fontanero el jueves por la mañana"
        },
        {
          "mine": true,
          "text": "perfecto, estaré en casa"
        },
        {
          "mine": false,
          "text": "sobre las diez le digo que pase"
        },
        {
          "mine": true,
          "text": "genial, muchas gracias"
        },
        {
          "mine": false,
          "text": "a mandar"
        }
      ]
    },
    {
      "name": "Marta",
      "messages": [
        {
          "mine": false,
          "text": "feliz cumpleaños!! que lo pases genial 🎉"
        },
        {
          "mine": true,
          "text": "muchas gracias guapa!!"
        },
        {
          "mine": false,
          "text": "hacemos algo el finde para celebrarlo?"
        },
        {
          "mine": true,
          "text": "me encantaría, unas cañas el sábado?"
        },
        {
          "mine": false,
          "text": "hecho, aviso a los demás"
        },
        {
          "mine": true,
          "text": "perfecto, un abrazo enorme"
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
          "text": "tu passes dimanche pour le déjeuner?"
        },
        {
          "mine": true,
          "text": "oui vers midi ça te va?"
        },
        {
          "mine": false,
          "text": "parfait je fais un rôti"
        },
        {
          "mine": true,
          "text": "miam j'apporte le dessert"
        },
        {
          "mine": false,
          "text": "d'accord, roule doucement"
        },
        {
          "mine": true,
          "text": "promis, à dimanche bisous"
        }
      ]
    },
    {
      "name": "Thomas",
      "messages": [
        {
          "mine": true,
          "text": "on est toujours ok pour demain?"
        },
        {
          "mine": false,
          "text": "ouais 19h à la salle"
        },
        {
          "mine": true,
          "text": "je peux venir te chercher?"
        },
        {
          "mine": false,
          "text": "avec plaisir, vers 18h30"
        },
        {
          "mine": true,
          "text": "nickel, oublie pas ta gourde"
        },
        {
          "mine": false,
          "text": "haha oui chef à demain"
        }
      ]
    },
    {
      "name": "Camille",
      "messages": [
        {
          "mine": false,
          "text": "tu as reçu le fichier?"
        },
        {
          "mine": true,
          "text": "oui je l'ouvre là"
        },
        {
          "mine": false,
          "text": "les chiffres à jour sont dans le dernier onglet"
        },
        {
          "mine": true,
          "text": "super c'est exactement ça merci"
        },
        {
          "mine": false,
          "text": "de rien, tu me le renvoies quand t'as vu?"
        },
        {
          "mine": true,
          "text": "avant ce soir sans faute"
        }
      ]
    },
    {
      "name": "Dentiste",
      "messages": [
        {
          "mine": false,
          "text": "rappel: votre rdv est mardi à 10h30"
        },
        {
          "mine": true,
          "text": "merci, possible un peu plus tard? genre 11h"
        },
        {
          "mine": false,
          "text": "on peut faire 11h15, ça vous convient?"
        },
        {
          "mine": true,
          "text": "parfait merci beaucoup"
        },
        {
          "mine": false,
          "text": "très bien, à mardi"
        },
        {
          "mine": true,
          "text": "à mardi"
        }
      ]
    },
    {
      "name": "Léa",
      "messages": [
        {
          "mine": true,
          "text": "j'ai 10 min de retard désolée!"
        },
        {
          "mine": false,
          "text": "pas de souci je garde une table"
        },
        {
          "mine": true,
          "text": "merci! commande moi un café"
        },
        {
          "mine": false,
          "text": "c'est fait, près de la fenêtre"
        },
        {
          "mine": true,
          "text": "top j'arrive"
        },
        {
          "mine": false,
          "text": "prends ton temps"
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
          "text": "vieni a pranzo domenica?"
        },
        {
          "mine": true,
          "text": "sì certo, verso l'una?"
        },
        {
          "mine": false,
          "text": "perfetto faccio le lasagne"
        },
        {
          "mine": true,
          "text": "che buono, porto il dolce"
        },
        {
          "mine": false,
          "text": "bravo, guida piano mi raccomando"
        },
        {
          "mine": true,
          "text": "tranquilla, a domenica un bacio"
        }
      ]
    },
    {
      "name": "Marco",
      "messages": [
        {
          "mine": true,
          "text": "confermi per la partita domani?"
        },
        {
          "mine": false,
          "text": "sì alle 18 al solito campo"
        },
        {
          "mine": true,
          "text": "passo a prenderti?"
        },
        {
          "mine": false,
          "text": "dai, alle 17:30"
        },
        {
          "mine": true,
          "text": "ok non scordare le scarpe stavolta 😄"
        },
        {
          "mine": false,
          "text": "haha va bene a domani"
        }
      ]
    },
    {
      "name": "Giulia",
      "messages": [
        {
          "mine": false,
          "text": "ti è arrivato il file?"
        },
        {
          "mine": true,
          "text": "sì lo sto aprendo ora"
        },
        {
          "mine": false,
          "text": "i dati aggiornati sono nell'ultimo foglio"
        },
        {
          "mine": true,
          "text": "perfetto era proprio quello grazie"
        },
        {
          "mine": false,
          "text": "figurati, me lo rimandi quando l'hai visto?"
        },
        {
          "mine": true,
          "text": "entro stasera senz'altro"
        }
      ]
    },
    {
      "name": "Idraulico",
      "messages": [
        {
          "mine": true,
          "text": "buongiorno, il rubinetto perde ancora"
        },
        {
          "mine": false,
          "text": "passo giovedì mattina va bene?"
        },
        {
          "mine": true,
          "text": "sì sarò in casa"
        },
        {
          "mine": false,
          "text": "verso le nove porto il pezzo di ricambio"
        },
        {
          "mine": true,
          "text": "ottimo grazie mille"
        },
        {
          "mine": false,
          "text": "a giovedì"
        }
      ]
    },
    {
      "name": "Sara",
      "messages": [
        {
          "mine": false,
          "text": "tanti auguri!! passa una bellissima giornata 🎉"
        },
        {
          "mine": true,
          "text": "grazie mille!!"
        },
        {
          "mine": false,
          "text": "facciamo qualcosa nel weekend per festeggiare?"
        },
        {
          "mine": true,
          "text": "volentieri, un aperitivo sabato?"
        },
        {
          "mine": false,
          "text": "perfetto avviso gli altri"
        },
        {
          "mine": true,
          "text": "grande, un abbraccio"
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
          "text": "vens almoçar no domingo?"
        },
        {
          "mine": true,
          "text": "vou sim, por volta do meio-dia"
        },
        {
          "mine": false,
          "text": "boa, faço bacalhau"
        },
        {
          "mine": true,
          "text": "que bom, levo a sobremesa"
        },
        {
          "mine": false,
          "text": "está bem, conduz com cuidado"
        },
        {
          "mine": true,
          "text": "prometo, até domingo beijinho"
        }
      ]
    },
    {
      "name": "Pedro",
      "messages": [
        {
          "mine": true,
          "text": "continua de pé o jogo amanhã?"
        },
        {
          "mine": false,
          "text": "sim às 18h no campo do costume"
        },
        {
          "mine": true,
          "text": "passo por ti?"
        },
        {
          "mine": false,
          "text": "boa, às 17h30"
        },
        {
          "mine": true,
          "text": "combinado, não te esqueças das chuteiras 😅"
        },
        {
          "mine": false,
          "text": "haha desta vez não, até amanhã"
        }
      ]
    },
    {
      "name": "Inês",
      "messages": [
        {
          "mine": false,
          "text": "recebeste o ficheiro?"
        },
        {
          "mine": true,
          "text": "sim estou a abrir agora"
        },
        {
          "mine": false,
          "text": "os dados novos estão na última folha"
        },
        {
          "mine": true,
          "text": "perfeito era isso mesmo obrigado"
        },
        {
          "mine": false,
          "text": "de nada, devolves quando vires?"
        },
        {
          "mine": true,
          "text": "até ao fim do dia sem falta"
        }
      ]
    },
    {
      "name": "Senhorio",
      "messages": [
        {
          "mine": true,
          "text": "boa tarde, a torneira da cozinha continua a pingar"
        },
        {
          "mine": false,
          "text": "mando o canalizador na quinta de manhã"
        },
        {
          "mine": true,
          "text": "ótimo, estarei em casa"
        },
        {
          "mine": false,
          "text": "por volta das dez ele passa aí"
        },
        {
          "mine": true,
          "text": "obrigado, até quinta"
        },
        {
          "mine": false,
          "text": "de nada"
        }
      ]
    },
    {
      "name": "Rita",
      "messages": [
        {
          "mine": false,
          "text": "estou 10 min atrasada desculpa!"
        },
        {
          "mine": true,
          "text": "sem stress, guardo uma mesa"
        },
        {
          "mine": true,
          "text": "queres que peça um galão?"
        },
        {
          "mine": false,
          "text": "sim por favor, junto à janela"
        },
        {
          "mine": true,
          "text": "feito, já cá está"
        },
        {
          "mine": false,
          "text": "estou a chegar 🙂"
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
          "text": "kom je zondag eten?"
        },
        {
          "mine": true,
          "text": "ja hoor, rond twaalven?"
        },
        {
          "mine": false,
          "text": "prima, ik maak soep"
        },
        {
          "mine": true,
          "text": "lekker, ik neem het toetje mee"
        },
        {
          "mine": false,
          "text": "goed, rij voorzichtig"
        },
        {
          "mine": true,
          "text": "doe ik, tot zondag kus"
        }
      ]
    },
    {
      "name": "Bram",
      "messages": [
        {
          "mine": true,
          "text": "gaat de training morgen nog door?"
        },
        {
          "mine": false,
          "text": "ja 19 uur in de hal"
        },
        {
          "mine": true,
          "text": "zal ik je ophalen?"
        },
        {
          "mine": false,
          "text": "graag, rond half 7"
        },
        {
          "mine": true,
          "text": "top, vergeet je schoenen niet 😄"
        },
        {
          "mine": false,
          "text": "haha nee joh tot morgen"
        }
      ]
    },
    {
      "name": "Sanne",
      "messages": [
        {
          "mine": false,
          "text": "heb je het bestand ontvangen?"
        },
        {
          "mine": true,
          "text": "ja ik open het nu"
        },
        {
          "mine": false,
          "text": "de nieuwe cijfers staan op het laatste tabblad"
        },
        {
          "mine": true,
          "text": "top precies wat ik nodig had bedankt"
        },
        {
          "mine": false,
          "text": "graag gedaan, stuur je het terug als je gekeken hebt?"
        },
        {
          "mine": true,
          "text": "voor het eind van de dag"
        }
      ]
    },
    {
      "name": "Tandarts",
      "messages": [
        {
          "mine": false,
          "text": "herinnering: uw controle is dinsdag om 10:30"
        },
        {
          "mine": true,
          "text": "bedankt, kan het iets later? rond 11 uur?"
        },
        {
          "mine": false,
          "text": "11:15 kan, schikt dat?"
        },
        {
          "mine": true,
          "text": "prima, dank u wel"
        },
        {
          "mine": false,
          "text": "tot dinsdag"
        },
        {
          "mine": true,
          "text": "tot dan"
        }
      ]
    },
    {
      "name": "Lieke",
      "messages": [
        {
          "mine": true,
          "text": "ik ben 10 min later sorry!"
        },
        {
          "mine": false,
          "text": "geen stress ik pak een tafeltje"
        },
        {
          "mine": true,
          "text": "bestel je alvast een koffie voor me?"
        },
        {
          "mine": false,
          "text": "gedaan, bij het raam"
        },
        {
          "mine": true,
          "text": "top bijna er"
        },
        {
          "mine": false,
          "text": "rustig aan hoor"
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
          "text": "przyjdziesz w niedzielę na obiad?"
        },
        {
          "mine": true,
          "text": "tak, około południa?"
        },
        {
          "mine": false,
          "text": "super, robię rosół"
        },
        {
          "mine": true,
          "text": "pysznie, przyniosę ciasto"
        },
        {
          "mine": false,
          "text": "dobrze, jedź ostrożnie"
        },
        {
          "mine": true,
          "text": "obiecuję, do niedzieli buziaki"
        }
      ]
    },
    {
      "name": "Kuba",
      "messages": [
        {
          "mine": true,
          "text": "jesteśmy umówieni jutro na trening?"
        },
        {
          "mine": false,
          "text": "tak 19 na hali jak zwykle"
        },
        {
          "mine": true,
          "text": "podrzucić cię?"
        },
        {
          "mine": false,
          "text": "chętnie, o 18:30"
        },
        {
          "mine": true,
          "text": "spoko, weź buty tym razem 😅"
        },
        {
          "mine": false,
          "text": "haha wezmę do jutra"
        }
      ]
    },
    {
      "name": "Ola",
      "messages": [
        {
          "mine": false,
          "text": "dostałeś plik?"
        },
        {
          "mine": true,
          "text": "tak, właśnie otwieram"
        },
        {
          "mine": false,
          "text": "nowe dane są w ostatniej zakładce"
        },
        {
          "mine": true,
          "text": "super o to chodziło dzięki"
        },
        {
          "mine": false,
          "text": "nie ma sprawy, odeślij jak przejrzysz"
        },
        {
          "mine": true,
          "text": "do końca dnia na pewno"
        }
      ]
    },
    {
      "name": "Hydraulik",
      "messages": [
        {
          "mine": true,
          "text": "dzień dobry, kran w kuchni dalej cieknie"
        },
        {
          "mine": false,
          "text": "wpadnę w czwartek rano, pasuje?"
        },
        {
          "mine": true,
          "text": "tak, będę w domu"
        },
        {
          "mine": false,
          "text": "koło dziesiątej, wezmę część na wymianę"
        },
        {
          "mine": true,
          "text": "świetnie, dziękuję"
        },
        {
          "mine": false,
          "text": "do czwartku"
        }
      ]
    },
    {
      "name": "Ania",
      "messages": [
        {
          "mine": false,
          "text": "wszystkiego najlepszego!! 🎉"
        },
        {
          "mine": true,
          "text": "dziękuję bardzo!!"
        },
        {
          "mine": false,
          "text": "zrobimy coś w weekend żeby uczcić?"
        },
        {
          "mine": true,
          "text": "chętnie, piwo w sobotę?"
        },
        {
          "mine": false,
          "text": "super, dam znać reszcie"
        },
        {
          "mine": true,
          "text": "świetnie, ściskam"
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
          "text": "придёшь в воскресенье на обед?"
        },
        {
          "mine": true,
          "text": "да, часам к двум?"
        },
        {
          "mine": false,
          "text": "хорошо, сделаю борщ"
        },
        {
          "mine": true,
          "text": "вкусно, привезу торт"
        },
        {
          "mine": false,
          "text": "ладно, езжай аккуратно"
        },
        {
          "mine": true,
          "text": "обещаю, до воскресенья, целую"
        }
      ]
    },
    {
      "name": "Дима",
      "messages": [
        {
          "mine": true,
          "text": "завтра тренировка в силе?"
        },
        {
          "mine": false,
          "text": "да в 19 в зале как обычно"
        },
        {
          "mine": true,
          "text": "заехать за тобой?"
        },
        {
          "mine": false,
          "text": "давай, в 18:30"
        },
        {
          "mine": true,
          "text": "ок, не забудь кроссовки в этот раз 😄"
        },
        {
          "mine": false,
          "text": "ха-ха возьму, до завтра"
        }
      ]
    },
    {
      "name": "Настя",
      "messages": [
        {
          "mine": false,
          "text": "файл получил?"
        },
        {
          "mine": true,
          "text": "да, открываю"
        },
        {
          "mine": false,
          "text": "новые цифры на последней вкладке"
        },
        {
          "mine": true,
          "text": "отлично, то что нужно, спасибо"
        },
        {
          "mine": false,
          "text": "не за что, вернёшь как посмотришь?"
        },
        {
          "mine": true,
          "text": "до конца дня точно"
        }
      ]
    },
    {
      "name": "Сантехник",
      "messages": [
        {
          "mine": true,
          "text": "здравствуйте, кран на кухне всё капает"
        },
        {
          "mine": false,
          "text": "зайду в четверг утром, удобно?"
        },
        {
          "mine": true,
          "text": "да, буду дома"
        },
        {
          "mine": false,
          "text": "часам к десяти, привезу деталь"
        },
        {
          "mine": true,
          "text": "отлично, спасибо большое"
        },
        {
          "mine": false,
          "text": "до четверга"
        }
      ]
    },
    {
      "name": "Катя",
      "messages": [
        {
          "mine": false,
          "text": "с днём рождения!! хорошего дня 🎉"
        },
        {
          "mine": true,
          "text": "спасибо большое!!"
        },
        {
          "mine": false,
          "text": "отметим на выходных?"
        },
        {
          "mine": true,
          "text": "с удовольствием, посидим в субботу?"
        },
        {
          "mine": false,
          "text": "отлично, позову остальных"
        },
        {
          "mine": true,
          "text": "здорово, обнимаю"
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
          "text": "прийдеш у неділю на обід?"
        },
        {
          "mine": true,
          "text": "так, десь о другій?"
        },
        {
          "mine": false,
          "text": "добре, зварю борщ"
        },
        {
          "mine": true,
          "text": "смакота, привезу торт"
        },
        {
          "mine": false,
          "text": "гаразд, їдь обережно"
        },
        {
          "mine": true,
          "text": "обіцяю, до неділі, цілую"
        }
      ]
    },
    {
      "name": "Сергій",
      "messages": [
        {
          "mine": true,
          "text": "завтра тренування в силі?"
        },
        {
          "mine": false,
          "text": "так о 19 у залі як завжди"
        },
        {
          "mine": true,
          "text": "заїхати за тобою?"
        },
        {
          "mine": false,
          "text": "давай, о 18:30"
        },
        {
          "mine": true,
          "text": "ок, не забудь кросівки цього разу 😄"
        },
        {
          "mine": false,
          "text": "ха-ха візьму, до завтра"
        }
      ]
    },
    {
      "name": "Оля",
      "messages": [
        {
          "mine": false,
          "text": "файл отримав?"
        },
        {
          "mine": true,
          "text": "так, відкриваю"
        },
        {
          "mine": false,
          "text": "нові цифри на останній вкладці"
        },
        {
          "mine": true,
          "text": "чудово, саме те, дякую"
        },
        {
          "mine": false,
          "text": "нема за що, повернеш як переглянеш?"
        },
        {
          "mine": true,
          "text": "до кінця дня точно"
        }
      ]
    },
    {
      "name": "Сантехнік",
      "messages": [
        {
          "mine": true,
          "text": "доброго дня, кран на кухні досі капає"
        },
        {
          "mine": false,
          "text": "зайду в четвер зранку, зручно?"
        },
        {
          "mine": true,
          "text": "так, буду вдома"
        },
        {
          "mine": false,
          "text": "десь о десятій, привезу деталь"
        },
        {
          "mine": true,
          "text": "чудово, дуже дякую"
        },
        {
          "mine": false,
          "text": "до четверга"
        }
      ]
    },
    {
      "name": "Іра",
      "messages": [
        {
          "mine": false,
          "text": "з днем народження!! гарного дня 🎉"
        },
        {
          "mine": true,
          "text": "дуже дякую!!"
        },
        {
          "mine": false,
          "text": "відзначимо на вихідних?"
        },
        {
          "mine": true,
          "text": "залюбки, посидимо в суботу?"
        },
        {
          "mine": false,
          "text": "чудово, покличу інших"
        },
        {
          "mine": true,
          "text": "класно, обіймаю"
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
          "text": "pazar yemeğe gelecek misin?"
        },
        {
          "mine": true,
          "text": "evet, öğlen gibi?"
        },
        {
          "mine": false,
          "text": "tamam, mantı yapıyorum"
        },
        {
          "mine": true,
          "text": "çok iyi, tatlıyı ben getiririm"
        },
        {
          "mine": false,
          "text": "olur, dikkatli sür"
        },
        {
          "mine": true,
          "text": "söz, pazar görüşürüz öptüm"
        }
      ]
    },
    {
      "name": "Mert",
      "messages": [
        {
          "mine": true,
          "text": "yarınki maç hâlâ var mı?"
        },
        {
          "mine": false,
          "text": "evet 18'de her zamanki sahada"
        },
        {
          "mine": true,
          "text": "seni alayım mı?"
        },
        {
          "mine": false,
          "text": "olur, 17:30 gibi"
        },
        {
          "mine": true,
          "text": "tamam, bu sefer ayakkabıları unutma 😄"
        },
        {
          "mine": false,
          "text": "haha unutmam, yarın görüşürüz"
        }
      ]
    },
    {
      "name": "Zeynep",
      "messages": [
        {
          "mine": false,
          "text": "dosya sana ulaştı mı?"
        },
        {
          "mine": true,
          "text": "evet, şimdi açıyorum"
        },
        {
          "mine": false,
          "text": "yeni veriler son sekmede"
        },
        {
          "mine": true,
          "text": "harika, tam da buydu teşekkürler"
        },
        {
          "mine": false,
          "text": "rica ederim, bakınca geri yollar mısın?"
        },
        {
          "mine": true,
          "text": "gün sonuna kadar kesin"
        }
      ]
    },
    {
      "name": "Ev Sahibi",
      "messages": [
        {
          "mine": true,
          "text": "merhaba, mutfaktaki musluk hâlâ damlıyor"
        },
        {
          "mine": false,
          "text": "perşembe sabahı tesisatçıyı yollayayım"
        },
        {
          "mine": true,
          "text": "tamam, evde olurum"
        },
        {
          "mine": false,
          "text": "onda gibi gelir, parçayı da getirir"
        },
        {
          "mine": true,
          "text": "süper, çok teşekkürler"
        },
        {
          "mine": false,
          "text": "rica ederim"
        }
      ]
    },
    {
      "name": "Elif",
      "messages": [
        {
          "mine": false,
          "text": "iyi ki doğdun!! güzel bir gün olsun 🎉"
        },
        {
          "mine": true,
          "text": "çok teşekkür ederim!!"
        },
        {
          "mine": false,
          "text": "hafta sonu kutlamak için bir şeyler yapalım mı?"
        },
        {
          "mine": true,
          "text": "bayılırım, cumartesi bir şeyler içelim mi?"
        },
        {
          "mine": false,
          "text": "harika, diğerlerine haber veririm"
        },
        {
          "mine": true,
          "text": "süper, sarıldım"
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
          "text": "周日回来吃饭吗"
        },
        {
          "mine": true,
          "text": "回啊，中午到"
        },
        {
          "mine": false,
          "text": "好，我包饺子"
        },
        {
          "mine": true,
          "text": "太好了，我带水果"
        },
        {
          "mine": false,
          "text": "路上慢点开车"
        },
        {
          "mine": true,
          "text": "知道啦，周日见"
        }
      ]
    },
    {
      "name": "小李",
      "messages": [
        {
          "mine": true,
          "text": "明天还打球吗"
        },
        {
          "mine": false,
          "text": "打，六点老地方"
        },
        {
          "mine": true,
          "text": "我去接你吧"
        },
        {
          "mine": false,
          "text": "行，五点半"
        },
        {
          "mine": true,
          "text": "记得带球鞋啊 😄"
        },
        {
          "mine": false,
          "text": "哈哈这次不会忘，明天见"
        }
      ]
    },
    {
      "name": "王姐",
      "messages": [
        {
          "mine": false,
          "text": "文件收到了吗"
        },
        {
          "mine": true,
          "text": "收到了，正在看"
        },
        {
          "mine": false,
          "text": "最新的数据在最后一页"
        },
        {
          "mine": true,
          "text": "好的就是这个，谢谢"
        },
        {
          "mine": false,
          "text": "不客气，看完发回给我"
        },
        {
          "mine": true,
          "text": "今天下班前一定"
        }
      ]
    },
    {
      "name": "房东",
      "messages": [
        {
          "mine": true,
          "text": "您好，厨房水龙头还在滴水"
        },
        {
          "mine": false,
          "text": "周四上午让师傅过去看看"
        },
        {
          "mine": true,
          "text": "好的，我在家"
        },
        {
          "mine": false,
          "text": "大概十点，会带配件过去"
        },
        {
          "mine": true,
          "text": "太好了，谢谢您"
        },
        {
          "mine": false,
          "text": "客气"
        }
      ]
    },
    {
      "name": "小美",
      "messages": [
        {
          "mine": false,
          "text": "生日快乐！！今天开开心心的 🎉"
        },
        {
          "mine": true,
          "text": "谢谢你呀！！"
        },
        {
          "mine": false,
          "text": "周末一起庆祝一下呗"
        },
        {
          "mine": true,
          "text": "好啊，周六出来吃个饭？"
        },
        {
          "mine": false,
          "text": "行，我叫上大家"
        },
        {
          "mine": true,
          "text": "太好了，抱抱"
        }
      ]
    }
  ]
};
