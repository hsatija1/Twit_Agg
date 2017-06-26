var fs = require('fs');
var Twit = require('twit');
var fixedWidthString = require('fixed-width-string');
var http = require('http');
var pdf = require('html-pdf');
const nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');



// for sorting the tags,
// we can make an array of objects with the hashtag, and the amount of time the hastag is used
// we can then call an array.sort(function(obj1, obj2) {
//   return hashtag num > hashtag num;
// })


var T = new Twit({
    consumer_key: 'W0ZbeqRtejvYlMwBulFN7rWTJ',
    consumer_secret: 'jfqcAkbtpWAmO7iiJx2RZSc7QvjoZxXuU7yXq1LXDypG540IMB',
    access_token: '271784805-NUp8tmrSA5j5yS8yHru1FDROj24EyfjUyghQ3TI5',
    access_token_secret: '6S1OXyTln9wYwjwsj8foeEgBwNl57HQUhsISK9reIZlSh',
    timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
});


//Globals
var maxId;
var hashtagArr = [];
//grab first tweet incase as point of reference
//incase new tweet appears
var getFirstTweet = T.get('statuses/user_timeline', {
    screen_name: process.argv[2],
    count: 1
}, function(err, data, response) {
	

});

getFirstTweet.then(() => {}).catch((e) => {
    console.log(e);
}).then(() => {
    var currMaxId = maxId;
    var numTweets = 500; //can be changed up to 3.2k //unnecessary for deepLocal1
    //get the tweets
    T.get('statuses/user_timeline', {
        screen_name: process.argv[2],
        count: numTweets
    }, function(err, data, response) {
        if (err) {console.log("\nCheck the twitter handle\n"); process.exit();}
        for (var i = 0; i < numTweets; i++) {
            if (data[i] == undefined) {
                //console.log("No more tweets!\n"+data[i]);
                break;
            }
            //check the years //prune 2017
            var currYear = data[i].created_at.substring(data[i].created_at.length - 4, data[i].created_at.length);

            if (currYear < 2016) {
                //console.log(currYear);          
                break;
            } else if (currYear == '2016') {
                //console.log("??"+currYear);          
                continue;
            } else {
                //console.log("--"+currYear);	
                //check if there's hashtags, if so, add 'em'
                if (!(data[i].entities.hashtags.length == 0)) {
                    data[i].entities.hashtags.forEach(function(element) {
                        //function to find hashtag object in Arr
                        function findHashtag(hashtag) {
                            return hashtag.name === element.text;
                        }
                        var tempElement = hashtagArr.find(findHashtag);

                        //if there is a hash tag add to it, else make new one
                        if (!(tempElement == undefined)) {
                            hashtagArr[hashtagArr.indexOf(tempElement)].count++;
                        } else {
                            hashtagArr.push({
                                name: element.text,
                                count: 1
                            });
                        }
                    });
                }
            }
        }
        hashtagArr.sort(function(a, b) {
            return b.count - a.count;
        });
        console.log("\n"+process.argv[2] + "'s Hashtag Frequencies started at http://localhost/\n ");

        http.createServer(function(req, res) {
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.write('<!doctype html>\n<html lang="en">\n' +
                '\n<meta charset="utf-8">\n<title>Test web page on node.js</title>\n' +
                '<style type="text/css">* {font-family:arial, sans-serif;}</style>\n' +
                '\n\n<h1>Twitter Aggregator</h1>\n' +
                '<div id="content"><p>The following is an aggregated report of hastags used by ' + process.argv[2] + ' :</p>' + '<table>' + '<tr><td><b>' + fixedWidthString("Hashtag", 30) + "</td></b><td><b>Count:</td>" + '</b>');
            hashtagArr.forEach(function(element) {
                //  console.log(fixedWidthString(element.name, 30)+' '+element.count);

                res.write('<tr><td>' + fixedWidthString(element.name, 30) + '</td><td>' + element.count + '</td></tr>');
            });

            res.write('</table></div> \n\n');
            res.end();
            //console.log(res.send());
        }).listen(80, 'localhost');

        var options = {
            host: 'localhost',
            path: '/'
        }
        var request = http.request(options, function(res) {
            var data = '';
            res.on('data', function(chunk) {
                data += chunk;
            });
            res.on('end', function() {
                //console.log(data.toString());
                var html = data;
                var options = {
                    format: 'Letter'
                };

                pdf.create(html, options).toFile('./' + process.argv[2] + '.pdf', function(err, res) {
                    if (err) return console.log(err);
                    console.log("Pdf Created!");
                });

            });
        });
        request.on('error', function(e) {
            console.log(e.message);
        });
        request.end();
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: 'hsatija1@gmail.com',
                clientId: '477531360917-cntbg5hgu8vn0u37og9mhln1o9qv83gt.apps.googleusercontent.com',
                clientSecret: 'NtFny-eMUK6DU9jqIgq-QzOf',
                refreshToken: '1/_P9GWFrhyMT34kXkT1GEw6FO87Ea-7ddwF4d7sMeWkg'
            },
        });
        var mailOptions = {
            from: 'hsatija1@gmail.com',
            to: process.argv[3],
            subject: 'nodemailer',
            text: 'Please find attached ' + process.argv[2] + "'s hashtag aggregate report.\n\n Thank You.",
            attachments: [{
                filename: 'report.pdf',
                path: __dirname + '/' + process.argv[2] + '.pdf'
                //content: mustache.render(data.toString(), args),
                //contentType: 'text/plain' // optional, would be detected from the filename
            }, ],
        }

        transporter.sendMail(mailOptions, function(err, res) {
            if (err) {
                console.log('error');
            } else {
                console.log('Email Sent to '+process.argv[3]);
            }
        })



    });
}).catch((e) => {
    console.log(e);
})
