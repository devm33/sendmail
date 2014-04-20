# SendMail

SendMail is intended for individuals trying automate their email usage we seek to provide a solution for scheduling message sending. Being able to precisely schedule email sending allows users to optimize timing for important messages, to effortlessly send out emails at pre-designated times, and to even send themselves reminders (such as re-sending themselves an email to review at a later time).

View live here: [sendmail4911.herokuapp.com](https://sendmail4911.herokuapp.com/), and get [chrome extension here.](https://chrome.google.com/webstore/detail/sendmail/dnljffkjlnkgabakkicokgdfbbkegglf)

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
######Disclaimer: this is only "RESTish" currently, but rest assured that we are working on making it fully RESTful.

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
- [Node.js](http://nodejs.org/download/)
- [Redis](http://redis.io/download)

To run locally (by which I mean anywhere except Heroku) you'll need [node](http://nodejs.org/download/) (and 
[npm](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)) available, and then in this repo run:

    $ npm install
to install the node.js dependencies for the app.

Once you've got the dependencies set up (including redis) you can run these shortcut scripts:
    
    $ bash up_local.sh
    $ bash down_local.sh
    $ bash reup_local.sh
    
Their names should be pretty self-explanatory, but so far they're only wrapping up two or so lines of code, so you should just read them and see that they can definitely be ported to whatever environment you may be deploying to.

## Contributing

We're happy to take issues or pull requests! We will ask you to run this script on code to be merged:

    $ bash pre_merge.sh

which requires [jshint](http://jshint.com/install/) (available through npm).

If you want to make styles changes you'll need [compass](http://compass-style.org/) (a CSS pre-processor built on top of [sass](http://sass-lang.com/)), [install here](http://compass-style.org/install/)

Thanks!

## License
Copyright (c) 2014 Devraj Mehta, David Kearns, David Lee.

Licensed under [the MIT license](https://github.com/devm33/sendmail/blob/master/LICENSE).
