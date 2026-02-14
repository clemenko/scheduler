act as if you are a building a web application for a volunteer fire department to help with scheduling personnel and equipment. The is similar to https://whentowork.com/, https://volunteerschedulerpro.com and  The app needs to allow users to login and schedule what equipment they are riding on for a 4 hour block. The app should have a calendar view and a table view. The administrator will need to be able to edit the vehicles and event time periods. Only administrators can delete or change the vehicle or events. Users can sign up for the event and vehicle.
Build this app from a modern framework that should utilize docker containers. 

Here are some of the rules.

-    Calendar interface like we had in WhenToHelp
-    Ability to have multiple different schedulable entities each day for different periods of time and durations (A409, TA40, E402, E401, Drill, PubEd, etc) along with setting a maximum number of people who can sign up for each (3 for A409, 6 for an engine, etc)
-    Email sent to everyone in the system when something has been added to the schedule and is available for signup
-    Email reminder to those are signed up for an event (24hrs in advance or configurable)
-    Any user is allowed to set something up but only the person who created it or an administrator can delete or modify and event

