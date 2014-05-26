# SendMail

SendMail is a web app that hooks into GMail's API to add scheduled sending of emails.

There's a [chrome extension here](https://chrome.google.com/webstore/detail/sendmail/dnljffkjlnkgabakkicokgdfbbkegglf) that inject's the added functionality right into GMail.

It can also be accessed and managed from the website: [sendmail4911.herokuapp.com](https://sendmail4911.herokuapp.com/) (either through a browser or our [API](#api).)

Finally, this project was built with cloning in mind, so we've tried to make that as easy as possible see: [setup](#setup). Please let us know if you see a way it could be made easier.

#### Table of Contents

* [User Manual](#user-manual)
* [API](#api)
* [Setup Your Own](#setup)
* [Contributing](#contributing)
* [License](#license)

## User Manual
Navigate to https://sendmail4911.herokuapp.com to see a live version of SendMail.
Once there, you will be presented with two options:

1. Signin with Google
2. Download the Chrome Extension

Website:
* "Sign in with Google" will take you to the main page of the website.
* After you sign in, you will be presented with a standard form in which you can compose an email message to be sent at a later time.
* At the top of the page, you will also see a toggle button to change between the "Compose" screen and "Scheduled" screen.
* The "Scheduled" screen presents you with a list of all scheduled events.
* You can click "edit" or "delete" to change any scheduled items.

Chrome Extension:
* Upon clicking to "Download the Chrome Extension", you will be directed to Google's Chrome Web Store where you can download and install the SendMail extension.
* After installation, a new SendMail icon will appear in your extensions bar. Clicking this icon will bring up a description of SendMail and provide a link to sign in. After authenticating with Google, you will be prompted to continue to Gmail to use the extension. Clicking the icon now will provide you with the ability to logout of the extension, and also provide a link to your scheduled event list.
* Once in GMail, the extension offers two main functionalities:
    * The ability to schedule a message to be sent at a later time is accessible via GMail's standard "Compose" screen. A new option "Send Later" should be presented along the botton of the screen. Clicking this will prompt you to select a time to send the message.
    * The ability to set a reminder on a message is accessible whenever you are viewing a message in your mailbox. Along the top of the message, you will be presented with a new option to "Remind Me Later". Clicking this will prompt you to select a time to be reminded. At that time, the message will be marked as UNREAD and be moved to your INBOX (if not there already).

## API
**Disclaimer:** this is only "RESTish" currently, but rest assured that we are working on making it fully RESTful.

###/oauth2callback
GET to initiate an authenticated session. This is our callback route for Google's OAuth. Of course this can be passed along to us by anyroute so long as it is valid. See here for more details: https://developers.google.com/accounts/docs/OAuth2Login

###/schedule
POST an email object to this endpoint to have it saved and scheduled to be sent as authenticated user.
```js
{
   to: "first@example.com,second@example.com",
   time: "2014-04-21T20:30:00.000Z",
   subject: "The subject of your email",
   body: "The body of your email. <strong>HTML is allowed here and will be sent as given.</strong>",
   key: "user-key"
}
```
- Only `to` and `time` are truly required.
  - `to` must be a comma separated list of email addresses (at least one must be given)
  - `time` must be in the UTC timezone. Any format that [ECMAScript Date](http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.3.2) can parse works here, but [ISO8601](http://www.iso.org/iso/iso8601) is preferred.
- `key` is an optional field, only neccesary if sending without an authenticated session, for example from a trusted third party application.

###/remind
POST a reminder object to this endpoint and it will saved under your user and scheduled to be moved around your inbox.
```js
{
   gmid: "4568642db3456765",
   subject: "Used for display in scheduled list",
   time: "2014-04-21T20:30:00.000Z",
   isReminder: true,
   key: "user-key"
}
```
- All fields, except `key`, should be considered required.
- Same note for `time` as in `/schedule` applies.

###/mailforuser
GET a JSON array of mail objects associated with the authenticated user.

###/deletemail/`$mail_id`
GET with proper auth to delete and cancel the sending of the mail object with the given ID.
Note: proper auth in this case refers to being signed in with the user associated with the given mail object.

###/profile
GET a JSON object containing the authenticated user's profile information, given an authenticated session.
```js
{
   key: "user_key",
   imageUrl: "https://lh5.googleusercontent.com/.../photo.jpg?sz=50",
   displayName: "First Last",
   email: "user@example.com",
   id: "user_id"
}
```

###/logout
GET to destroy any authenticated session associated with the access.

## Setup

#### 3-step guide to launching your own Heroku instance

1. On Heroku, [create an account](https://signup.heroku.com/signup/dc), [create a new app](https://dashboard.heroku.com/apps), and choose a redis add-on (I used [RedisToGo](https://addons.heroku.com/redistogo).
2. [Get a Google app ID and secret](https://developers.google.com/accounts/docs/OAuth2Login#getcredentials) and save it in a file called `secrets.json` in your repo, formatted as such:
   ```json
   {
       "web": {
           "client_id": "your-client-id",
           "client_secret": "your-client-secret"
       },
       "cookie_pass": "optional-but-highly-recommended"
   }
   ```
  (Pro-Tip: you can download a json file from the [Google developer console](https://console.developers.google.com/) after you get your client id which matches these criteria, plus a bunch of other stuff that's fine to have in there).

3. Clone this repo, add your `secrets.json` file and [add your Heroku project as a remote](https://devcenter.heroku.com/articles/git#creating-a-heroku-remote) then just use git to deploy:

        $ git push heroku master

#### Deploying elsewhere

High level dependencies:

- [Node.js](http://nodejs.org/download/) and [npm](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)
- [Redis](http://redis.io/download)

Once `node` and `npm` are available the nodejs dependencies can be installed by running following command in the repo directory.

    $ npm install --production

Once you've got the dependencies set up (including redis) use `make` to control the app:

    $ make up
    $ make down

where `up` will start the application and `down` will shut it down.

Also, running `make` with no parameters or `make help` will print a help text.

#### Developing locally

To setup a development instance drop the production flag from npm install to include the dev dependencies.

Also one of dev dependencies, [gulp-compass](https://www.npmjs.org/package/gulp-compass), depends on [compass](http://compass-style.org/) which can be installed using `gem`

    $ gem install compass
    $ npm install

You can now use the following additional make commands

- `build` to compile the scss to css and lint the js files with jshint

#### On Windows
_Don't ask me why I did this._

If you're looking to set up on Windows there are some special considerations to take into account:

- The [default installer for node](http://nodejs.org/download/) should work to get you both node and npm, but I might recommend using the [manual install of node](https://github.com/joyent/node/wiki/Building-and-installing-Node.js#manual-install-1) for the same reasons they do:
    > Installing Node manually is recommended as a workaround for any problems with automatic install. You also have much better understanding of the things that happen if you do those things yourself.

    - Basically, you have to download the exe's for node and npm, put them in a folder, and that folder to your system path
    - [node.exe](http://nodejs.org/dist/latest/node.exe) or [x64/node.exe](http://nodejs.org/dist/latest/x64/node.exe) and zip containing npm available [here](http://nodejs.org/dist/npm/) (grab the latest)
- Install redis was less straightforward. The way I chose to do it was using [Microsoft Open Tech's port](https://github.com/MSOpenTech/redis) though there seem to be several other ports available.
    - Clone their repo <https://github.com/MSOpenTech/redis.git>
    - You can either unzip their exe's from `bin/release/` or use Visual Studio to build your own using the solution file in `msvs/RedisServer.sln`
    - Add the path to the folder containing your chosen exe's to your system path.
- Finally, GNU make will be handy to run the control commands (though not neccessary as you could take them out of the Makefile and run them another way).
    Personally, I use [Cygwin](https://cygwin.com/install.html) to accomplish this (and many other things on Windows), but [SO indicates](http://stackoverflow.com/questions/12881854/how-to-use-gnu-make-on-windows) you could get away with simply using [MinGW](http://www.mingw.org/).
- Now you can refer to [Deploying elsewhere](#deploying-elsewhere) with the high-level dependencies resolved.

If you're planning on developing on Windows you'll also need ruby to compile the compass scss files.

- The defacto method of getting ruby on Windows seems to be [RubyInstaller](http://rubyinstaller.org/downloads/) which worked great for me.
- With ruby is installed (and subsequently gem) you can refer to [Developing locally](#developing-locally).

## Contributing

We're happy to take issues or pull requests!

Thanks!

## License
Copyright (c) 2014 Devraj Mehta, David Kearns, David Lee.

Licensed under [the MIT license](https://github.com/devm33/sendmail/blob/master/LICENSE).
