SendMail
========

SendMail is intended for individuals trying automate their email usage we seek to provide a solution for scheduling message sending. Being able to precisely schedule email sending allows users to optimize timing for important messages, to effortlessly send out emails at pre-designated times, and to even send themselves reminders (such as re-sending themselves an email to review at a later time).

View live here: [sendmail4911.herokuapp.com](https://sendmail4911.herokuapp.com/)

Setup
-----
Assuming you have clone/forked the repo and have 
[node](http://nodejs.org/download/) and therefore npm 
[installed](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager) already run this in the gitdir to install the project dependencies:

    $ npm install -d
    
Then you just need [compass](http://compass-style.org/) (a CSS pre-processor built on top of [sass](http://sass-lang.com/)), [install here](http://compass-style.org/install/)

Once you've got both node and compass you can run the local testing scripts
    
    $ ./up_local.sh
    $ ./down_local.sh
    $ ./reup_local.sh
    
Their names should be pretty self-explanatory, but so far they're only wrapping
up two or so lines of code, so you could just check out the source.

In order to run these in a *sh terminal environment, you'll probably want to
change the permissions by running something like:

    $ chmod a+x *_local.sh
    
Now you're off and running! The team looks forward to your pull requests -
Thanks!


Dependencies
------------
- node.js
  - express
  - ejs
  - request
- compass


