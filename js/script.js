/* ===========================================================
   SKOLSIDAN – gemensam JavaScript-fil
   Den här filen sköter:
   1) Inloggningen på index.html
   2) Kontroll att man får vara på en sida (linda/naomi/admin)
   3) Utloggningsknappen

   OBS: Detta är en enkel skoluppgift/prototyp. Lösenorden ligger
   synliga i koden nedan, så detta är INTE säkert på riktigt -
   men det räcker perfekt för att visa hur en inloggning fungerar.
   =========================================================== */

// Här ligger alla "konton". Vill du ändra lösenord gör du det här.
const ANVANDARE = {
  linda: {
    losenord: "linda123",
    namn: "Lindha",
    sida: "linda.html"
  },
  naomi: {
    losenord: "naomi123",
    namn: "Naiomi",
    sida: "naomi.html"
  },
  admin: {
    losenord: "admin123",
    namn: "Admin",
    sida: "admin.html"
  }
};

/* -----------------------------------------------------------
   DEL 1: Inloggningssidan (index.html)
   ----------------------------------------------------------- */

// Håller koll på vilken namnskylt användaren har klickat på
let valdAnvandare = null;

function initieraInloggning() {
  const namnskyltar = document.querySelectorAll(".namnskylt");
  const inloggningsformular = document.getElementById("inloggningsformular");

  // Om vi inte är på inloggningssidan finns dessa element inte - avbryt då
  if (!inloggningsformular) {
    return;
  }

  namnskyltar.forEach(function (skylt) {
    skylt.addEventListener("click", function () {
      // Ta bort "vald" från alla skyltar, lägg sedan till på den man klickade på
      namnskyltar.forEach(function (s) {
        s.classList.remove("vald");
      });
      skylt.classList.add("vald");

      valdAnvandare = skylt.getAttribute("data-anvandare");

      document.getElementById("tavla-rubrik").textContent =
        "Lösenord för " + ANVANDARE[valdAnvandare].namn;
      document.getElementById("tavla").classList.remove("dold");
      document.getElementById("losenord").focus();
      document.getElementById("felmeddelande").textContent = "";
    });
  });

  inloggningsformular.addEventListener("submit", function (event) {
    event.preventDefault(); // hindrar sidan från att ladda om
    const felmeddelande = document.getElementById("felmeddelande");

    if (!valdAnvandare) {
      felmeddelande.textContent = "Välj vem du är genom att klicka på en namnskylt.";
      return;
    }

    const inmatatLosenord = document.getElementById("losenord").value;

    if (inmatatLosenord === ANVANDARE[valdAnvandare].losenord) {
      // Lösenordet stämmer - spara vem som är inloggad och gå vidare
      sessionStorage.setItem("inloggadSom", valdAnvandare);
      window.location.href = ANVANDARE[valdAnvandare].sida;
    } else {
      felmeddelande.textContent = "Fel lösenord, försök igen.";
    }
  });
}

/* -----------------------------------------------------------
   DEL 2: Skydda vy-sidorna (linda.html, naomi.html, admin.html)
   ----------------------------------------------------------- */

// Anropas högst upp på varje vy-sida.
// "sidansAgare" = "linda", "naomi" eller "admin"
function kravInloggning(sidansAgare) {
  const inloggadSom = sessionStorage.getItem("inloggadSom");

  const farVaraHar =
    inloggadSom === sidansAgare || inloggadSom === "admin";

  if (!farVaraHar) {
    window.location.href = "index.html";
    return;
  }

  // Visa vem som är inloggad högst upp på sidan
  const infoText = document.getElementById("inloggad-info");
  if (infoText) {
    infoText.textContent = "Inloggad som: " + ANVANDARE[inloggadSom].namn;
  }

  // Om det är Admin som tittar på Lindhas eller Naiomis sida,
  // visa menyn så Admin lätt kan hoppa vidare till en annan vy.
  const adminmeny = document.getElementById("adminmeny");
  if (adminmeny && inloggadSom === "admin") {
    adminmeny.classList.remove("dold");
  }
}

/* -----------------------------------------------------------
   DEL 3: Logga ut
   ----------------------------------------------------------- */

function loggaUt() {
  sessionStorage.removeItem("inloggadSom");
  window.location.href = "index.html";
}

/* ===========================================================
   DEL 4: Delad kalender (Lindha, Naiomi och Admin ser samma lista)
   Sparas i localStorage under nyckeln "delad_kalender" som en
   lista (array) av objekt: { id, datum, text, skapadAv }
   ----------------------------------------------------------- */

// Håller koll på om vi just nu redigerar en post, och i så fall vilken
let redigerarKalenderId = null;

function hamtaKalender() {
  const sparat = localStorage.getItem("delad_kalender");
  return sparat ? JSON.parse(sparat) : [];
}

function sparaKalender(lista) {
  localStorage.setItem("delad_kalender", JSON.stringify(lista));
}

function renderaKalender() {
  const listElement = document.getElementById("kalender-lista");
  if (!listElement) {
    return; // Vi är inte på en sida med kalender - avbryt
  }

  const handelser = hamtaKalender().sort(function (a, b) {
    return a.datum.localeCompare(b.datum);
  });

  if (handelser.length === 0) {
    listElement.innerHTML = '<li class="kalender-tom">Inga händelser inlagda ännu.</li>';
    return;
  }

  const idag = new Date().toISOString().slice(0, 10);

  listElement.innerHTML = handelser
    .map(function (handelse) {
      const harPasserat = handelse.datum < idag ? "passerad" : "";
      const datumText = new Date(handelse.datum).toLocaleDateString("sv-SE", {
        weekday: "short",
        day: "numeric",
        month: "short"
      });

      // Om just den här posten håller på att redigeras - visa textfält istället
      if (redigerarKalenderId === handelse.id) {
        return (
          '<li class="kalender-post ' + harPasserat + '">' +
          '<span class="kalender-datum">' + datumText + "</span>" +
          '<input type="time" id="kalender-redigera-tid" value="' + (handelse.tid || "") + '" />' +
          '<input type="text" id="kalender-redigera-plats" value="' +
          (handelse.plats || "").replace(/"/g, "&quot;") +
          '" placeholder="Plats" style="width:100px; padding:0.4rem;" />' +
          '<input type="text" id="kalender-redigera-text" value="' +
          handelse.text.replace(/"/g, "&quot;") +
          '" style="flex:1; padding:0.4rem;" />' +
          '<div class="kalender-knappar">' +
          '<button onclick="sparaRedigeradKalenderPost(\'' + handelse.id + '\')" title="Spara">💾</button>' +
          '<button onclick="avbrytRedigeraKalender()" title="Avbryt">✖️</button>' +
          "</div></li>"
        );
      }

      const tidText = handelse.tid ? handelse.tid : "";
      const platsText = handelse.plats ? " · " + handelse.plats : "";

      return (
        '<li class="kalender-post ' + harPasserat + '">' +
        '<span class="kalender-datum">' + datumText + (tidText ? " " + tidText : "") + "</span>" +
        '<span class="kalender-text">' + handelse.text + platsText + "</span>" +
        '<span class="kalender-av">' + (ANVANDARE[handelse.skapadAv] ? ANVANDARE[handelse.skapadAv].namn : "") + "</span>" +
        '<div class="kalender-knappar">' +
        '<button onclick="borjaRedigeraKalender(\'' + handelse.id + '\')" title="Ändra">✏️</button>' +
        '<button onclick="taBortKalenderPost(\'' + handelse.id + '\')" title="Ta bort">🗑️</button>' +
        "</div></li>"
      );
    })
    .join("");

  renderaOversikt(); // uppdatera adminens siffror om den finns på sidan
}

function laggTillKalenderHandelse() {
  const datumFalt = document.getElementById("kalender-datum");
  const tidFalt = document.getElementById("kalender-tid");
  const platsFalt = document.getElementById("kalender-plats");
  const textFalt = document.getElementById("kalender-text");

  if (!datumFalt.value || !textFalt.value.trim()) {
    alert("Fyll i både datum och text för att lägga till en händelse.");
    return;
  }

  const handelser = hamtaKalender();
  handelser.push({
    id: "h_" + Date.now(),
    datum: datumFalt.value,
    tid: tidFalt.value,
    plats: platsFalt.value.trim(),
    text: textFalt.value.trim(),
    skapadAv: sessionStorage.getItem("inloggadSom")
  });
  sparaKalender(handelser);

  datumFalt.value = "";
  tidFalt.value = "";
  platsFalt.value = "";
  textFalt.value = "";
  renderaKalender();
}

function taBortKalenderPost(id) {
  const handelser = hamtaKalender().filter(function (h) {
    return h.id !== id;
  });
  sparaKalender(handelser);
  renderaKalender();
}

function borjaRedigeraKalender(id) {
  redigerarKalenderId = id;
  renderaKalender();
}

function avbrytRedigeraKalender() {
  redigerarKalenderId = null;
  renderaKalender();
}

function sparaRedigeradKalenderPost(id) {
  const nyttText = document.getElementById("kalender-redigera-text").value.trim();
  const nyTid = document.getElementById("kalender-redigera-tid").value;
  const nyPlats = document.getElementById("kalender-redigera-plats").value.trim();

  if (!nyttText) {
    alert("Texten kan inte vara tom.");
    return;
  }

  const handelser = hamtaKalender();
  const post = handelser.find(function (h) {
    return h.id === id;
  });
  if (post) {
    post.text = nyttText;
    post.tid = nyTid;
    post.plats = nyPlats;
  }
  sparaKalender(handelser);

  redigerarKalenderId = null;
  renderaKalender();
}

/* ===========================================================
   DEL 5: Lindhas anteckningstavla (personliga lappar)
   Sparas i localStorage under nyckeln "linda_lappar"
   ----------------------------------------------------------- */

function hamtaLappar() {
  const sparat = localStorage.getItem("linda_lappar");
  return sparat ? JSON.parse(sparat) : [];
}

function sparaLappar(lista) {
  localStorage.setItem("linda_lappar", JSON.stringify(lista));
}

// Högsta antal lappar som får finnas uppsatta samtidigt
const MAX_ANTAL_LAPPAR = 9;

function renderaLappar() {
  const container = document.getElementById("lapp-container");
  if (!container) {
    return;
  }

  // .slice().reverse() så att den senast uppsatta lappen visas först
  const lappar = hamtaLappar().slice().reverse();

  if (lappar.length === 0) {
    container.innerHTML = '<p class="kalender-tom">Inga lappar uppsatta ännu.</p>';
    return;
  }

  container.innerHTML = lappar
    .map(function (lapp) {
      return (
        '<div class="lapp">' +
        '<button class="lapp-ta-bort" onclick="taBortLapp(\'' + lapp.id + '\')" title="Ta bort lapp">✖️</button>' +
        "<p>" + lapp.text + "</p>" +
        "</div>"
      );
    })
    .join("");
}

function laggTillLapp() {
  const textFalt = document.getElementById("lapp-text");
  if (!textFalt.value.trim()) {
    return;
  }

  const lappar = hamtaLappar();

  if (lappar.length >= MAX_ANTAL_LAPPAR) {
    alert("Du har nått max antal lappar (" + MAX_ANTAL_LAPPAR + "). Ta bort en lapp för att kunna sätta upp en ny.");
    return;
  }

  lappar.push({ id: "l_" + Date.now(), text: textFalt.value.trim() });
  sparaLappar(lappar);

  textFalt.value = "";
  renderaLappar();
}

function taBortLapp(id) {
  const lappar = hamtaLappar().filter(function (l) {
    return l.id !== id;
  });
  sparaLappar(lappar);
  renderaLappar();
}

/* ===========================================================
   DEL 6: Naiomis anteckningsverktyg
   Sparas i localStorage under nyckeln "naomi_anteckningar" som
   en lista av { id, titel, innehall, uppdaterad }
   ----------------------------------------------------------- */

let vaidAnteckningId = null; // vilken anteckning som är öppen just nu

function hamtaAnteckningar() {
  const sparat = localStorage.getItem("naomi_anteckningar");
  return sparat ? JSON.parse(sparat) : [];
}

function sparaAnteckningar(lista) {
  localStorage.setItem("naomi_anteckningar", JSON.stringify(lista));
}

function renderaAnteckningslista() {
  const listElement = document.getElementById("anteckningslista");
  if (!listElement) {
    return;
  }

  const sokText = (document.getElementById("anteckning-sok").value || "").toLowerCase();

  let anteckningar = hamtaAnteckningar().sort(function (a, b) {
    return b.uppdaterad.localeCompare(a.uppdaterad);
  });

  if (sokText) {
    anteckningar = anteckningar.filter(function (a) {
      return a.titel.toLowerCase().includes(sokText) || a.innehall.toLowerCase().includes(sokText);
    });
  }

  if (anteckningar.length === 0) {
    listElement.innerHTML = '<li class="kalender-tom" style="cursor:default;">Inga anteckningar hittades.</li>';
    return;
  }

  listElement.innerHTML = anteckningar
    .map(function (a) {
      const vald = a.id === vaidAnteckningId ? "vald" : "";
      const snutt = a.innehall.slice(0, 40) || "(tom anteckning)";
      return (
        '<li class="' + vald + '" onclick="oppnaAnteckning(\'' + a.id + '\')">' +
        '<span class="lista-titel">' + (a.titel || "Namnlös anteckning") + "</span>" +
        '<span class="lista-snutt">' + snutt + "</span>" +
        "</li>"
      );
    })
    .join("");
}

function renderaAnteckningEditor() {
  const editorContainer = document.getElementById("anteckning-editor-yta");
  if (!editorContainer) {
    return;
  }

  const anteckning = hamtaAnteckningar().find(function (a) {
    return a.id === vaidAnteckningId;
  });

  if (!anteckning) {
    editorContainer.innerHTML =
      '<p class="anteckning-tom-vy">Välj en anteckning i listan, eller skapa en ny.</p>';
    return;
  }

  editorContainer.innerHTML =
    '<div class="anteckning-editor">' +
    '<input type="text" id="anteckning-titel-falt" placeholder="Titel" value="' +
    anteckning.titel.replace(/"/g, "&quot;") + '" />' +
    '<textarea id="anteckning-innehall-falt" maxlength="1000" oninput="uppdateraTeckenraknare()" placeholder="Skriv din anteckning här...">' +
    anteckning.innehall +
    "</textarea>" +
    '<p class="tecken-raknare" id="tecken-raknare"></p>' +
    '<div class="anteckning-editor-knappar">' +
    '<button class="ta-bort-anteckning-knapp" onclick="taBortAnteckning(\'' + anteckning.id + '\')">Ta bort</button>' +
    '<button class="spara-anteckning-knapp" onclick="sparaOppenAnteckning()">Spara</button>' +
    "</div></div>";

  uppdateraTeckenraknare();
}

// Visar hur många av de 1000 tillåtna tecknen som är använda
function uppdateraTeckenraknare() {
  const falt = document.getElementById("anteckning-innehall-falt");
  const raknare = document.getElementById("tecken-raknare");
  if (falt && raknare) {
    raknare.textContent = falt.value.length + " / 1000 tecken";
  }
}

function skapaNyAnteckning() {
  const anteckningar = hamtaAnteckningar();
  const nyAnteckning = {
    id: "a_" + Date.now(),
    titel: "Ny anteckning",
    innehall: "",
    uppdaterad: new Date().toISOString()
  };
  anteckningar.push(nyAnteckning);
  sparaAnteckningar(anteckningar);

  vaidAnteckningId = nyAnteckning.id;
  renderaAnteckningslista();
  renderaAnteckningEditor();
  document.getElementById("anteckning-titel-falt").focus();
}

function oppnaAnteckning(id) {
  vaidAnteckningId = id;
  renderaAnteckningslista();
  renderaAnteckningEditor();
}

function sparaOppenAnteckning() {
  const anteckningar = hamtaAnteckningar();
  const anteckning = anteckningar.find(function (a) {
    return a.id === vaidAnteckningId;
  });

  if (!anteckning) {
    return;
  }

  anteckning.titel = document.getElementById("anteckning-titel-falt").value.trim() || "Namnlös anteckning";
  anteckning.innehall = document.getElementById("anteckning-innehall-falt").value;
  anteckning.uppdaterad = new Date().toISOString();

  sparaAnteckningar(anteckningar);
  renderaAnteckningslista();
}

function taBortAnteckning(id) {
  const anteckningar = hamtaAnteckningar().filter(function (a) {
    return a.id !== id;
  });
  sparaAnteckningar(anteckningar);

  vaidAnteckningId = null;
  renderaAnteckningslista();
  renderaAnteckningEditor();
}

/* ===========================================================
   DEL 7: Adminens översikt av allt innehåll
   Räknar ihop det som redan ligger sparat i localStorage för
   kalendern, Lindhas lappar och Naiomis anteckningar.
   ----------------------------------------------------------- */

function renderaOversikt() {
  const container = document.getElementById("oversikt-grid");
  if (!container) {
    return; // Vi är inte på adminsidan - avbryt
  }

  const idag = new Date().toISOString().slice(0, 10);

  const antalKommandeHandelser = hamtaKalender().filter(function (h) {
    return h.datum >= idag;
  }).length;

  const antalLappar = hamtaLappar().length;
  const antalAnteckningar = hamtaAnteckningar().length;

  const kort = [
    {
      antal: antalKommandeHandelser,
      etikett: "Kommande händelser i kalendern"
    },
    {
      antal: antalLappar,
      etikett: "Lappar på Lindhas anteckningstavla"
    },
    {
      antal: antalAnteckningar,
      etikett: "Anteckningar hos Naiomi"
    }
  ];

  container.innerHTML = kort
    .map(function (k) {
      return (
        '<div class="oversikt-kort">' +
        '<span class="oversikt-antal">' + k.antal + "</span>" +
        '<p class="oversikt-etikett">' + k.etikett + "</p>" +
        "</div>"
      );
    })
    .join("");
}

/* Kör igång kalender/tavla/anteckningsverktyg om de finns på sidan */
document.addEventListener("DOMContentLoaded", function () {
  renderaKalender();
  renderaLappar();
  renderaAnteckningslista();
  renderaAnteckningEditor();
  renderaOversikt();
});

// Kör igång inloggningslogiken när sidan har laddats
document.addEventListener("DOMContentLoaded", initieraInloggning);
