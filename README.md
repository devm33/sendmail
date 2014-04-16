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


