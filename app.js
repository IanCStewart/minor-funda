(function(){
  'use strict';

  const appSettings = {
    url(param) { return ` http://funda.kyrandia.nl/feeds/Aanbod.svc/json/${config.API_KEY}/${param}`},
    main: document.querySelector('main'),
    html: ''
  };

  const app = {
    init() {
      routes.listen();
    }
  }

  const routes = {
    listen() {
      store.hydrate('?type=koop&zo=/amsterdam/tuin/&page=1&pagesize=25');
      window.addEventListener('hashchange', () => section.toggle(window.location.hash), false);
    }
  }

  const section = {
    toggle(route) {
      route === '' ? route = '#current' : null;
      routes.pages.forEach(function (page) {
        page === route
        ? document.querySelector(page).classList.remove('invisible')
        : document.querySelector(page).classList.add('invisible');
      });
    },
    log() {
      const data = JSON.parse(localStorage.getItem('funda'));
      appSettings.main.innerHTML = '';
      console.log(data);
    },
    error() {
      appSettings.main.innerHTML = 'connection error';
    }
  }

  const store = {
    hydrate(param) {
      const data = JSON.parse(localStorage.getItem('funda'));
      if (!data) {
        request.data(param);
      } else {
        localStorage.removeItem('funda');
        request.data(param);
      }
    },
    data(data) {
      localStorage.setItem('funda', JSON.stringify(data));
      section.log();
    }
  }

  const request = {
    data(param) {
      fetch(appSettings.url(param))
      .then(d => d.json())
      .then(d => store.data(d))
      .catch(section.error());
    }
  }

  app.init();
})();
