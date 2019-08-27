plat-dns
========

A plat is a map, drawn to scale, showing the divisions of a piece of land. Plat-dns is a tool that uses the dns system to let domain owners administer their land divisions with ease.

Sales Pitch
-----------

Are you a government that maintains census tracks, admins regions, state line?
Are you a business that has regional operations and need to create and administer maps?
Are you an indigenous group that is tired of the google maps view of a region?

If any of the above are true, plat-dns is an easy way for you to manage your world.

Getting Started
===============

Prerequisites
--------------

 1. Access to a domain name and its name server. You will need to be able to add a record to the name server you manage.
 2. Node installed. See (https://nodejs.org/en/)
 3. Dat installed. `npm i dat -g`

Step 1 - Decide domain path
----------------------------

Let's say you are admin a city with the domain `edmonton.ca`. You might want to partition your domain with 'neighbourhoods.edmonton.ca', so you'd have 'oliver.neighbourhoods.edmonton.ca' and 'mccauley.neighbourhoods.edmonton.ca'

Step 2 - Choose a plat-dns server
-----------------------------------

You can run this project on a server, or use our public plat server at ns.ramage.in

Step 3 - Add an NS record that points to plat
-----------------------------------------------

Type: NS, Host: neighbourhoods, Value: ns.ramage.in

Use the above information to put a record in **your** nameserver. This will point all *.neighbourhoods.edmonton.ca queries to the plat server selected in step 2.

Step 4 - Create a folder that will hold your shape files
--------------------------------------------------------

On your computer create a folder that will hold your shape files, and only your shape files

Step 5 - Create some shape files
---------------------------------

As a suggestion to test, you can go to http://geojson.io, and create a point, or polygon of your location. Then
In the menu click save -> GeoJson. Copy that file to the folder in step 4, and rename it the domain that it represents, eg `oliver.neighbourhoods.edmonton.ca` . Don't add a suffix.

Repeat this step with all the shapes you want to name.

Step 5 - Share this folder
--------------------------

Using the dat command line do the following. Change directory to the folder created in step 4.

```
cd ~/src/shapefiles
dat .

Created new dat in /Users/alice/src/shapefiles/.dat
dat://c81299cfc139791ccc6db42f0bcac8a9af590c03828e8066478fcfc60ca6e481
```

Step 6 - register with the server
---------------------------------

Now that you've delegated to the domain to plat, you need to tell it about your dat. Take that long ID from step 5 and do the following

    curl -X POST neighbourhoods.edmonton.ca/dat/c81299cfc139791ccc6db42f0bcac8a9af590c03828e8066478fcfc60ca6e481


Step 7 - test
--------------

Now in a browser you should be able to visit `http://oliver.neighbourhoods.edmonton.ca`. A google map pin will be returned to you!


Notes
------

 - You can continue to add/edit/delete files in your shared folder. These will magically update on the domain.
 - dat is a p2p protocol so you might want to create a mirror of your data on hashbase.io or another peer service
 
