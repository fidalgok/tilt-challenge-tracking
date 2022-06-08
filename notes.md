# Building a gym challenge tracker

I wanted to document the process of building out a "fun" side project for a fitness challenge at my gym. I dabble in coding in various capacities and through this would be a great exercise to build a real world application that allowed the members of our gym to track their progress of a step-up challenge while being able to see the progress of other members on a leaderboard.

Along the way I'll keep track of challenges, thoughts behind how I implemented things, and lessons learned. I am learning or relearning a lot of these technologies along the way so I'm sure this will be quite the satisfying challenge if I can pull it off.

## Tech Stack

Right off the bat I knew I wanted to try out Remix. I decided to go with one of their pre-built stacks to get a lot of the boilerplate out of the way as well as making some organizational decisions for me. I went with their Indie Stack which uses a simple Sqlite database, Prisma, and deploys to Fly.io.

## Challenges

A list of challenges faced while building the app.

- Designing and building a database schema is a lot trickier than I anticipated. I wanted to be clever and make this somewhat generic in case we wanted to use it again in the future for different kinds of challenges. That proved more difficult than I was imagining when coming up with relational fields in the prisma schema.
    - There is definitely a better way to organize the database schema than I have. I'd love to get some feedback when I'm done to see how it could be improved.
- Already seeing some of the limitations with using a sqlite database
    - can't use enums to define a set list of scalars for the db
    - can't use createMany from the Prisma client api
- When querying relational data you need to use select or include to actually get it to appear in your queries
    - Need to research whether this could appear in the types prisma generates or not. [It currently doesn't by default but you can make it work.][1]



    [1]: <https://github.com/prisma/prisma/discussions/10928#:~:text=Prisma%20Version&text=Since%20Prisma%20queries%20do%20not,%2Din%20utility%20types%2C%20though.>