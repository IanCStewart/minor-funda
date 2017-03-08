/*global window, document, config, fetch, navigator*/
(function(){
  'use strict';

  const appSettings = {
    urlFundaSearch(type, query, page, size) {return `http://funda.kyrandia.nl/feeds/Aanbod.svc/json/${config.FUNDA_KEY}/?type=${type}&zo=/${query}/&page=${page}&pagesize=${size}`;},
    urlGetAddress(lat, long) {return `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${config.GOOGLE_KEY}&result_type=street_address|locality`;},
    chat: document.querySelector('#chat'),
    error: document.querySelector('.error')
  };

  const app = {
    init() {
      routes.listen();
    }
  };

  const routes = {
    listen() {
      store.hydrate();
      window.addEventListener('hashchange', () => section.toggle(window.location.hash), false);
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
      console.log(data.Objects);
      let html = '';
      appSettings.error.innerHTML = '';
      appSettings.error.classList.add('invisible');
      data.Objects.forEach(object => {
        html = `
          <section>
            <h1>${object.Adres}</h1>
            <img src="${object.FotoLargest}"/>
            ${object.HuurprijsFormaat ? object.PrijsGeformatteerdTextHuur : object.PrijsGeformatteerdTextKoop}
          </section>
        `;
        appSettings.chat.innerHTML += html;
      })
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
        address
        ? resolve(request.data(appSettings.urlFundaSearch('koop', address.replace(/ /g, '-'), '1', '25')))
        : reject();
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
