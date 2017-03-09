/*global window, document, config, fetch, navigator*/
(function(){
  'use strict';

  const appSettings = {
    urlFundaSearch(type, address, options, page, size) {return `http://funda.kyrandia.nl/feeds/Aanbod.svc/json/${config.FUNDA_KEY}/?type=${type}&zo=/${address}/+0.001km${options}/&page=${page}&pagesize=${size}`;},
    urlGetAddress(lat, long) {return `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${config.GOOGLE_KEY}&result_type=street_address|locality`;},
    chat: document.querySelector('#chat-body'),
    error: document.querySelector('.error')
  };

  const app = {
    init() {
      routes.listen();
    }
  };

  const routes = {
    listen() {
      chat.listen();
      window.addEventListener('hashchange', () => section.toggle(window.location.hash), false);
    }
  };

  const chat = {
    listen() {
      this.nextQuestion();
      document.querySelector('#chat-form').addEventListener('submit', this.submit, false);
    },
    submit(event) {
      event.preventDefault();
      const input = document.querySelector('#chat-input');
      chat.awnserQuestion(input.value);
      input.value = '';
    },
    awnserQuestion(response) {
      appSettings.chat.innerHTML += `
        <section>
          <header><h1>user</h1></header>
          <p>${response}</p>
        </section>
      `;
      this.nextQuestion(response);
    },
    nextQuestion(response) {
      let html;

      switch (this.questionCount) {
        case 0:
          html = chat.questions[chat.questionCount];
          chat.questionCount = chat.questionCount + 1;
          break;
        case 1:
          if(response.toLowerCase() === 'koop' || response.toLowerCase() === 'huur') {
            html = chat.questions[chat.questionCount];
            chat.questionCount = chat.questionCount + 1;
            chat.userChoices.type = response.toLowerCase();
          } else {
            html = chat.awnsers[chat.questionCount - 1];
          }
          break;
        case 2:
          if(response.toLowerCase() === 'woonhuis' || response.toLowerCase() === 'appartement') {
            html = chat.questions[chat.questionCount];
            chat.questionCount = chat.questionCount + 1;
            chat.userChoices.options.push(response.toLowerCase());
          } else if(response.toLowerCase() === 'maakt niet uit') {
            html = chat.questions[chat.questionCount];
            chat.questionCount = chat.questionCount + 1;
          } else {
            html = chat.awnsers[chat.questionCount - 1];
          }
          break;
        case 3:
          if(response.toLowerCase() === 'balkon' || response.toLowerCase() === 'dakterras' || response.toLowerCase() === 'tuin') {
            html = chat.questions[chat.questionCount];
            chat.questionCount = chat.questionCount + 1;
            chat.userChoices.options.push(response.toLowerCase());
          } else if(response.toLowerCase() === 'maakt niet uit') {
            html = chat.questions[chat.questionCount];
            chat.questionCount = chat.questionCount + 1;
          } else {
            html = chat.awnsers[chat.questionCount - 1];
          }
          break;
        case 4:
          if(response.toLowerCase() === 'nieuwbouw' || response.toLowerCase() === 'bestaande bouw') {
            html = chat.questions[chat.questionCount];
            chat.questionCount = chat.questionCount + 1;
            chat.userChoices.options.push(response.toLowerCase());
            store.hydrate();
          } else if(response.toLowerCase() === 'maakt niet uit') {
            html = chat.questions[chat.questionCount];
            chat.questionCount = chat.questionCount + 1;
            store.hydrate();
          } else {
            html = chat.awnsers[chat.questionCount - 1];
          }
          break;
        case 5:
          if(response.toLowerCase() === 'ja') {
            html = chat.questions[0];
            chat.questionCount = 0;
            chat.userChoices = [];
          } else if(response.toLowerCase() === 'nee') {
            html = 'Oke top! Als je je nog bedenkt stuur dan even "ja" 😇';
          } else {
            html = chat.awnsers[chat.questionCount - 1];
          }
          break;
      }

      this.questionCount <= 5
      ? appSettings.chat.innerHTML += `
        <section>
          <header><h1>Fundapi</h1></header>
          <p>${html}</p>
        </section>`
      : null;
    },
    questionCount: 0,
    questions: [
      'zoekt u een "koop" huis of een "huur" huis?',
      'Zoek u naar een "woonhuis" of een "appartement"?',
      'Wat voor buiten ruimte is gewenst?',
      '"Nieuwbouw" of "Bestaande bouw"?',
      'Ik ga de huizen ophalen die voldoen aan u criteria'
    ],
    awnsers: [
      'Ik snap niet wat je bedoeld, antwoord met "koop" of "huur".',
      'Ik snap niet wat je bedoeld, antwoord met "woonhuis", "appartament" of "maakt niet uit".',
      'Ik snap niet wat je bedoeld, antwoord met "balkon", "dakterras", "tuin" of "maakt niet uit".',
      'Ik snap niet wat je bedoeld, antwoord met "Nieuwbouw", "Bestaande bouw" of "maakt niet uit".',
      'Ik snap niet wat je bedoeld, antwoord met "ja" of "nee".'
    ],
    userChoices: {
      type: '',
      options: []
    }
  };

  const section = {
    toggle(route) {
      route === '' ? route = '#current' : null;
      routes.pages.forEach(function (page) {
        page === route
        ? document.querySelector(page).classList.remove('invisible')
        : document.querySelector(page).classList.add('invisible');
      });
    },
    renderLocationObjects(data) {
      let html = '';
      appSettings.error.innerHTML = '';
      appSettings.error.classList.add('invisible');
      data.Objects.length > 0
      ? data.Objects.forEach(object => {
        html = `
          <section>
            <h1>${object.Adres}</h1>
            <img src="${object.FotoLargest}"/>
            ${object.HuurprijsFormaat ? object.PrijsGeformatteerdTextHuur : object.PrijsGeformatteerdTextKoop}
          </section>
        `;
        appSettings.chat.innerHTML += html;
      })
      : appSettings.chat.innerHTML += `
        <p>Theres no houses in this area "${data.Metadata.Omschrijving}"</p>
      `;
      appSettings.chat.innerHTML += 'Wilt u opnieuw beginnen?';
    },
    error(error) {
      let html = error ? error : 'seems like something went wrong';
      appSettings.error.innerHTML = `<section class="error">${html}<section>`;
    }
  };

  const location = {
    geo() {
      return new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(function(position) {
          position
          ? resolve({lat: position.coords.latitude, long: position.coords.longitude})
          :reject();
        });
      });
    },
    addres(lat, long) {
      return new Promise(function(resolve) {
        resolve(request.data(appSettings.urlGetAddress(lat, long)));
      });
    },
    getObjects(location) {
      let address;

      if (location.results[0].types.includes('street_address')) {
        const addressParts = location.results[0].address_components.filter(addressPart => addressPart.types.includes('route') || addressPart.types.includes('locality'));
        address = `${addressParts[1].short_name}/straat-${addressParts[0].short_name}`;
      } else if (!location.results[0].types.includes('street_address') && location.results[0].types.includes('locality')) {
        const addressParts = location.results[0].address_components.filter(addressPart => addressPart.types.includes('locality'));
        address = `${addressParts[0].short_name}`;
      }

      return new Promise(function(resolve, reject) {
        if (address && chat.userChoices.options.length > 0) {
          let options = '/';
          chat.userChoices.options.forEach(option => options += `${option}/`);
          resolve(request.data(appSettings.urlFundaSearch(chat.userChoices.type, address.replace(/ /g, '-'), options, '1', '25')));
        } else if (address && !chat.userChoices.options.length > 0) {
          resolve(request.data(appSettings.urlFundaSearch(chat.userChoices.type, address.replace(/ /g, '-'), '1', '25')));
        } else {
          reject();
        }
      });
    }
  };

  const store = {
    hydrate() {
      location.geo()
      .then(coords => location.addres(coords.lat, coords.long))
      .then(address => location.getObjects(address))
      .then(data => section.renderLocationObjects(data))
      .catch(section.error('couldnt get location'));
    }
  };

  const request = {
    data(url) {
      return new Promise(function(resolve){
        fetch(url)
        .then(d => d.json())
        .then(d => resolve(d))
        .catch(section.error());
      });
    }
  };

  app.init();
})();
