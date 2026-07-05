(function () {
  "use strict";
  window.__BRAND__ = {
    name: "El Celler del Segre",
    kind: "Restaurant · Braseria",
    phone: "973792095",
    phoneDisplay: "973 79 20 95",
    // TODO: 973792095 is a landline with no WhatsApp linked (confirmed — the
    // wa.me link errors out for real). whatsapp/whatsappDefaultText below are
    // unused right now (main.js calls tel: on form submit, wa-float is
    // commented out in index.html). Substitute a real mobile number here and
    // reactivate WhatsApp across the site once the client confirms one.
    whatsapp: "34973792095",
    whatsappDefaultText: "Hola, voldria fer una reserva a El Celler del Segre",
    instagram: "https://www.instagram.com/elcellerdesegre/?hl=es",
    address: {
      street: "Carrer 11 de Setembre",
      city: "25170 Torres de Segre, Lleida"
    },
    rating: { value: 4.3, count: 491 },
    priceRange: "10–20 € per persona (menú entre setmana)",
    schedule: {
      0: { opens: 8,   closes: 18, label: "Diumenge" },
      1: { opens: 7.5, closes: 19, label: "Dilluns" },
      2: { opens: 7.5, closes: 19, label: "Dimarts" },
      3: { opens: 7.5, closes: 19, label: "Dimecres" },
      4: { opens: 7.5, closes: 19, label: "Dijous" },
      5: { opens: 7.5, closes: 23, label: "Divendres" },
      6: { opens: 8,   closes: 23, label: "Dissabte" }
    }
  };
})();
