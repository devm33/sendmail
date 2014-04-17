Sendmail
========

SendMail is intended for individuals trying automate their email usage we seek to provide a solution for scheduling message sending. Being able to precisely schedule email sending allows users to optimize timing for important messages, to effortlessly send out emails at pre-designated times, and to even send themselves reminders (such as re-sending themselves an email to review at a later time).

View live here: [sendmail4911.herokuapp.com](https://sendmail4911.herokuapp.com/)

Setup
-----
High level dependencies:
- [Node.js](http://nodejs.org/download/)
- [Redis](http://redis.io/download)

If you would like to launch your own instance on Heroku simply clone this repo, add a secrets.json file with your Google app ID and secret ([see how to get these](https://developers.google.com/accounts/docs/OAuth2Login#getcredentials)), and then push it to a new Heroku project that has a Redis add-ons enabled -- it's that easy!

To run locally (by which I mean anywhere except Heroku) you'll need [node](http://nodejs.org/download/) (and 
[npm](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)) available, and then in this repo run:

    $ npm install
to install the node.js dependencies for the app.

Once you've got the dependencies set up (including redis) you can run these shortcut scripts:
    
    $ ./up_local.sh
    $ ./down_local.sh
    $ ./reup_local.sh
    
Their names should be pretty self-explanatory, but so far they're only wrapping
up two or so lines of code, so you could just check out the source.

In order to run these in a *sh terminal environment, you'll probably want to
change the permissions by running something like:

    $ chmod a+x *_local.sh

If you want to make styles changes you need [compass](http://compass-style.org/) (a CSS pre-processor built on top of [sass](http://sass-lang.com/)), [install here](http://compass-style.org/install/)

If you'd like to send us a pull request please run the quick validator and formatting script:

    $ ./pre_merge.sh

Note: this requires [jshint](http://jshint.com/install/) (available through npm).
    
Thanks and enjoy!

User Manual
-----------
Navigate to https://sendmail4911.herokuapp.com to see a live version of SendMail.
Once there, you will be presented with two options:

    1. Signin with Google
    2. Download the Chrome Extension

Website:
* "Sign in with Google" will take you to the main page of the website.
* After you sign in, you will be presented with a standard form in which you can compose an email message to be sent at a later time. 
* At the top of the page, you will also see a toggle button to change between the "Compose" screen and "Scheduled" screen. 
* The "Scheduled" screen presents you with a list of all scheduled events (both messages to be sent from both the website and the extension and reminders set up from within the extension.
* You can click "edit" or "delete" to change any scheduled items.

Chrome Extension:
* Upon clicking to "Download the Chrome Extension", you will be directed to Google's Chrome Web Store where you can download and install the SendMail extension.
* After installation, a new SendMail icon will appear in your extensions bar. Clicking this icon will bring up a description of SendMail and provide a link to sign in. After authenticating with Google, you will be prompted to continue to Gmail to use the extension. Clicking the icon now will provide you with the ability to logout of the extension, and also provide a link to your scheduled event list.
* Once in GMail, the extension offers two main functionalities:
    * The ability to schedule a message to be sent at a later time is accessible via GMail's standard "Compose" screen. A new option "Send Later" should be presented along the botton of the screen. Clicking this will prompt you to select a time to send the message.
    * The ability to set a reminder on a message is accessible whenever you are viewing a message in your mailbox. Along the top of the message, you will be presented with a new option to "Remind Me Later". Clicking this will prompt you to select a time to be reminded. At that time, the message will be marked as UNREAD and be moved to your INBOX (if not there already).
