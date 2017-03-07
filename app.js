/*global window, document, config, fetch, navigator*/
(function(){
  'use strict';

  const appSettings = {
    urlFundaSearch(type, query, page, size) {return `http://funda.kyrandia.nl/feeds/Aanbod.svc/json/${config.FUNDA_KEY}/?type=${type}&zo=/${query}/&page=${page}&pagesize=${size}`;},
    urlGetAddress(lat, long) {return `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${config.GOOGLE_KEY}`;},
    main: document.querySelector('main'),
    html: ''
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
    error() {
      appSettings.main.innerHTML = 'connection error';
    }
  };

  const location = {
    geo() {
      return new Promise(function(resolve) {
        navigator.geolocation.getCurrentPosition(function(position) {
          resolve({lat: position.coords.latitude, long: position.coords.longitude});
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
      }

      return new Promise(function(resolve) {
        resolve(request.data(appSettings.urlFundaSearch('koop', address, '1', '25')));
      });
    }
  };

  const store = {
    hydrate() {
      location.geo()
      .then(coords => location.addres(coords.lat, coords.long))
      .then(address => location.getObjects(address))
      .then(data => console.log(data));
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
