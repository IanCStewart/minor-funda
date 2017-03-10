/*global window, document, config, fetch, navigator, localStorage*/
(function(){
  'use strict';

  const appSettings = {
    urlFundaSearch(type, address, options, page, size) {return `http://funda.kyrandia.nl/feeds/Aanbod.svc/json/${config.FUNDA_KEY}/?type=${type}&zo=/${address}/+0.001km${options}/&page=${page}&pagesize=${size}`;},
    urlGetAddress(lat, long) {return `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${config.GOOGLE_KEY}&result_type=street_address|locality`;},
    chat: document.querySelector('#chat-body')
  };

  const app = {
    init() {
      routes.listen();
    }
  };

  const routes = {
    listen() {
      store.checkLocalStorage();
      window.addEventListener('hashchange', () => section.toggle(window.location.hash), false);
    }
  };

  const chat = {
    listen() {
      chat.questionCount != 5 ? this.nextQuestion() : null;
      document.querySelector('#chat-form').addEventListener('submit', this.submit, false);
    },
    submit(event) {
      event.preventDefault();
      const input = document.querySelector('#chat-input');
      input.value
      ? (section.renderChatMessage(input.value.toString(), 'user'), chat.nextQuestion(input.value.toString()))
      : null;
      input.value = '';
    },
    nextQuestion(response) {
      let html;

      switch (this.questionCount) {
        case 0:
          html = this.questions[this.questionCount];
          this.questionCount = this.questionCount + 1;
          this.userChoices.type = '';
          this.userChoices.options = [];
          section.renderChatMessage(html, 'fundapi');
          break;
        case 1:
          if(response.toLowerCase() === 'koop' || response.toLowerCase() === 'huur') {
            html = this.questions[this.questionCount];
            this.questionCount = this.questionCount + 1;
            this.userChoices.type = response.toLowerCase();
            section.renderChatMessage(html, 'fundapi');
          } else {
            html = this.answers[this.questionCount - 1];
            section.renderChatMessage(html, 'fundapi');
          }
          break;
        case 2:
          if(response.toLowerCase() === 'woonhuis' || response.toLowerCase() === 'appartement') {
            html = this.questions[this.questionCount];
            this.questionCount = this.questionCount + 1;
            this.userChoices.options.push(response.toLowerCase());
            section.renderChatMessage(html, 'fundapi');
          } else if(response.toLowerCase() === 'maakt niet uit') {
            html = this.questions[this.questionCount];
            this.questionCount = this.questionCount + 1;
            section.renderChatMessage(html, 'fundapi');
          } else {
            html = this.answers[this.questionCount - 1];
            section.renderChatMessage(html, 'fundapi');
          }
          break;
        case 3:
          if(response.toLowerCase() === 'balkon' || response.toLowerCase() === 'dakterras' || response.toLowerCase() === 'tuin') {
            html = this.questions[this.questionCount];
            this.questionCount = this.questionCount + 1;
            this.userChoices.options.push(response.toLowerCase());
            section.renderChatMessage(html, 'fundapi');
          } else if(response.toLowerCase() === 'maakt niet uit') {
            html = this.questions[this.questionCount];
            this.questionCount = this.questionCount + 1;
            section.renderChatMessage(html, 'fundapi');
          } else {
            html = this.answers[this.questionCount - 1];
            section.renderChatMessage(html, 'fundapi');
          }
          break;
        case 4:
          if(response.toLowerCase() === 'nieuwbouw' || response.toLowerCase() === 'bestaande bouw') {
            html = this.questions[this.questionCount];
            this.questionCount = this.questionCount + 1;
            this.userChoices.options.push(response.toLowerCase());
            section.renderChatMessage(html, 'fundapi');
            store.hydrate();
          } else if(response.toLowerCase() === 'maakt niet uit') {
            html = this.questions[this.questionCount];
            this.questionCount = this.questionCount + 1;
            section.renderChatMessage(html, 'fundapi');
            store.hydrate();
          } else {
            html = this.answers[this.questionCount - 1];
            section.renderChatMessage(html, 'fundapi');
          }
          break;
        case 6:
          if(response.toLowerCase() === 'ja') {
            html = this.questions[0];
            this.questionCount = 1;
            this.userChoices = [];
            this.nextHouse = 0;
            section.renderChatMessage(html, 'fundapi');
          } else if(response.toLowerCase() === 'nee') {
            this.hasNextHouse
            ? (
              html = 'Toch nog wel het volgende huis bekijken?',
              this.questionCount = this.questionCount - 1
            )
            : (
              html = 'Er zijn geen andere huizen. Wilt u het vorige huis opnieuw zien?',
              this.questionCount = this.questionCount - 1
            );
            section.renderChatMessage(html, 'fundapi');
          } else {
            html = this.answers[this.questionCount - 2];
            section.renderChatMessage(html, 'fundapi');
          }
          break;
        default:
          if(response.toLowerCase() === 'ja') {
            this.nextHouse + 1;
            section.renderLocationObjects(this.nextHouse);
          } else if(response.toLowerCase() === 'nee') {
            this.questionCount = this.questionCount + 1;
            html = 'Top als u een nieuwe zoek opdracht wilt doen stuur dan "ja"';
            section.renderChatMessage(html, 'fundapi');
          } else {
            html = this.answers[this.questionCount - 1];
            section.renderChatMessage(html, 'fundapi');
          }
          break;
      }
    },
    questionCount: 0,
    nextHouse: 0,
    hasNextHouse: true,
    questions: [
      'zoekt u een "koop" huis of een "huur" huis?',
      'Zoek u naar een "woonhuis" of een "appartement"?',
      'Wat voor buiten ruimte is gewenst?',
      '"Nieuwbouw" of "Bestaande bouw"?',
      'Ik ga de huizen ophalen die voldoen aan u criteria'
    ],
    answers: [
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
    scrollDown() {
      appSettings.chat.scrollTop = appSettings.chat.scrollHeight;
    },
    renderChatMessage(html, user) {
      appSettings.chat.innerHTML += `
        <section class="message ${user}">
          <div class="avatar"><img src="./assets/img/${user}-avatar.svg" /></div>
          <header><h1>${user}</h1></header>
          <p>${html}</p>
        </section>`;
      section.scrollDown();
    },
    unrenderLoader() {
      appSettings.chat.removeChild(document.querySelector('#loading'));
    },
    renderLocationObjects(dataNumber) {
      const data = JSON.parse(localStorage.getItem('fundaSearchResults'));
      data.Objects.length > 0
      ? appSettings.chat.innerHTML += `
          <section class="message house">
            <div class="avatar"><img src="./assets/img/fundapi-avatar.svg" /></div>
            <header><h1>${data.Objects[dataNumber].Adres}</h1></header>
            <p>
              <img class="house-img" src="${data.Objects[dataNumber].FotoLarge}"/>
              ${data.Objects[dataNumber].HuurprijsFormaat ? data.Objects[dataNumber].PrijsGeformatteerdTextHuur : data.Objects[dataNumber].PrijsGeformatteerdTextKoop}
            </p>
          </section>`
      : appSettings.chat.innerHTML += `
          <section class="message funda">
            <div class="avatar"><img src="./assets/img/fundapi-avatar.svg" /></div>
            <header><h1>API</h1></header>
            <p>
              Er zijn geen huizen die aan de volgende criteria voldoen. ${data.Metadata.Omschrijving}.
              Probeer het nog eens met andere antwoorden.
            </p>
          </section>`;
      this.scrollDown();
      data.Objects.length - 1 > dataNumber
      ? (
        chat.nextHouse = dataNumber + 1,
        chat.hasNextHouse = true,
        this.renderChatMessage('Wilt u het volgende huis zien?', 'fundapi')
      )
      : (
        chat.questionCount = 6,
        chat.hasNextHouse = false,
        this.renderChatMessage('Dit waren alle huizen in de zoek opdracht. Wilt u een nieuwe zoek opdracht beginnen?', 'fundapi')
      );
    },
    loading() {
      document.querySelector('#loading') === null
      ? appSettings.chat.innerHTML += `
        <section id="loading">
          <div class="avatar"><img src="./assets/img/fundapi-avatar.svg" /></div>
          <h1>Een moment we zijn aan het laden...</h1>
          <div></div>
          <p>Als de lader blijft staan, controleer dan uw connectie met het internet.</p>
        </section>`
      : null;
      section.scrollDown();
    }
  };

  const location = {
    geo() {
      return new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(
          position => position ? resolve({lat: position.coords.latitude, long: position.coords.longitude}) : reject(),
          error => reject(error),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
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
          localStorage.setItem(
            'fundaSearchOptions',
            JSON.stringify({
              type: chat.userChoices.type,
              address: address.replace(/ /g, '-'),
              options: options
            })
          );
          resolve(request.data(appSettings.urlFundaSearch(chat.userChoices.type, address.replace(/ /g, '-'), options, '1', '25')));
        } else if (address && !chat.userChoices.options.length > 0) {
          localStorage.setItem(
            'fundaSearchOptions',
            JSON.stringify({
              type: chat.userChoices.type,
              address: address.replace(/ /g, '-'),
              options: ''
            })
          );
          resolve(request.data(appSettings.urlFundaSearch(chat.userChoices.type, address.replace(/ /g, '-'), '', '1', '25')));
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
      .then(data => this.data(data))
      .then(() => section.unrenderLoader())
      .then(() => section.renderLocationObjects(0))
      .catch(section.loading());
    },
    data(data) {
      new Promise(function(resolve, reject) {
        localStorage.setItem('fundaSearchResults', JSON.stringify(data));
        localStorage.getItem('fundaSearchResults') ? resolve() : reject();
      });
    },
    checkLocalStorage() {
      const data = JSON.parse(localStorage.getItem('fundaSearchResults'));
      data
      ? (
        chat.questionCount = 5,
        chat.listen(),
        section.renderChatMessage('Zo te zien had je al naar huizen gekeken. Hier is het eerste huis van de laatste set.', 'fundapi'),
        section.renderLocationObjects(chat.nextHouse)
      )
      : chat.listen();
    }
  };

  const request = {
    data(url) {
      return new Promise(function(resolve){
        fetch(url)
        .then(d => d.json())
        .then(d => resolve(d))
        .catch(section.loading());
      });
    }
  };

  app.init();
})();
