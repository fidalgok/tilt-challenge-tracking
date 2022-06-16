# Building a gym challenge tracker

I wanted to document the process of building out a "fun" side project for a fitness challenge at my gym. I dabble in coding in various capacities and through this would be a great exercise to build a real world application that allowed the members of our gym to track their progress of a step-up challenge while being able to see the progress of other members on a leaderboard.

Along the way I'll keep track of challenges, thoughts behind how I implemented things, and lessons learned. I am learning or relearning a lot of these technologies along the way so I'm sure this will be quite the satisfying challenge if I can pull it off.

## Tech Stack

Right off the bat I knew I wanted to try out Remix. I decided to go with one of their pre-built stacks to get a lot of the boilerplate out of the way as well as making some sensible tech and organizational decisions for me. I went with their Indie Stack which uses a simple Sqlite database, Prisma, and deploys to Fly.io.

## Challenges

A list of challenges faced while building the app.

- Designing and building a database schema is a lot trickier than I anticipated. I wanted to be clever and make this somewhat generic in case we wanted to use it again in the future for different kinds of challenges. That proved more difficult than I was imagining when coming up with relational fields in the prisma schema.
    - There is definitely a better way to organize the database schema than I have. I'd love to get some feedback when I'm done to see how it could be improved.
- Already seeing some of the limitations with using a sqlite database
    - can't use enums to define a set list of scalars for the db
    - can't use createMany from the Prisma client api
- When querying relational data you need to use select or include to actually get it to appear in your queries
    - Need to research whether this could appear in the types prisma generates or not. [It currently doesn't by default but you can make it work.][1]
- Javascript Dates... oh boy. Had to do some [research into Javascript dates][2], [how Prisma stores and serves dates back to you][3], and how to reconcile javascript date manipulation between the various dates stored.
    - This has been the biggest issue... basically dates coming from the user need to be normalized and checked against UTC dates. All dates being stored in the DB get normalized to GMT. This causes pretty big problems on a date based app. Depending on the users offset you could be off by a day either reading or store data... again not great.
- Couldn't get the users profile to load in the project root for some reason. Even though I included the one to many relationship in the query and even added the code from one of the points above, my application still didn't recognize that the user object had a profile on it. Maybe it's due to how optional user handles the use matches? :shrug:



    [1]: <https://github.com/prisma/prisma/discussions/10928#:~:text=Prisma%20Version&text=Since%20Prisma%20queries%20do%20not,%2Din%20utility%20types%2C%20though.>
    [2]: <https://dev.to/zachgoll/a-complete-guide-to-javascript-dates-and-why-your-date-is-off-by-1-day-fi1>
    [3]: <https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#model-field-scalar-types>