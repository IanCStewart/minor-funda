# Project || Funda API
_Project for Funda during Web-Dev minor_

## concept
The concept is a conversational ui. Through the conversation the app will determine what ur after in a home. Through these awnsers the app will be able to fetch houses for your specific choice.

## deployment
Clone the repository:
```
$ git clone... && cd minor-funda
$ npm I
```

Make a config file:
```
$ touch config.js && vim config.js
```
```
var config = {
    FUNDA_KEY: 'your Funda API key',
    GOOGLE_KEY: 'your google API key'
};
```

Start browsersync:
```
$ npm start
```

App will run on `localhost:3000` if available, else it will choose another port.

## Usage
By browsing to the index.html file u can start using the app. The user will see a chat and be promoted with the first question. By answering questions the app makes a search based on your answer and returns the houses that match your location and answers. By continuing the conversation the user can see through all the found houses.

## Resources
- [Funda API](www.funda.nl)
- [Mozilla Developer Network](https://developer.mozilla.org/)

## Wishlist
- More conversational filter question
- More AI intelligence
- Let users like houses to look back at
- Code refactor
