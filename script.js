var scanlines = $('.scanlines');
var tv = $('.tv');
var timeOut;
function exit() {
    $('.tv').addClass('collapse');
    term.disable();
    setTimeout(function(){
        window.location.href = "https://www.spacejam.com/";
    }, 3000);
}

function space() {
    exit();
}

var greet = window.innerWidth < 775 ? '[[b;#F37735;]\n  _______            __         \n \/ ___\/ \/  ___ _____\/ \/__ ___   \n\/ \/__\/ _ \\\/ _ `\/ __\/ \/ -_|_-<   \n\\___\/_\/\/_\/\\_,_\/_\/ \/_\/\\__\/___\/   \n   __  ___                      \n  \/  |\/  \/__  ___  _______  ___ \n \/ \/|_\/ \/ _ \\\/ _ \\\/ __\/ _ \\\/ -_)\n\/_\/  \/_\/\\___\/_\/\/_\/_\/  \\___\/\\__\/ \n]' : '[[b;#F37735;]\n   ________               __             __  ___                          \n  \/ ____\/ \/_  ____ ______\/ \/__  _____   \/  |\/  \/___  ____  _________  ___ \n \/ \/   \/ __ \\\/ __ `\/ ___\/ \/ _ \\\/ ___\/  \/ \/|_\/ \/ __ \\\/ __ \\\/ ___\/ __ \\\/ _ \\\n\/ \/___\/ \/ \/ \/ \/_\/ \/ \/  \/ \/  __(__  )  \/ \/  \/ \/ \/_\/ \/ \/ \/ \/ \/  \/ \/_\/ \/  __\/\n\\____\/_\/ \/_\/\\__,_\/_\/  \/_\/\\___\/____\/  \/_\/  \/_\/\\____\/_\/ \/_\/_\/   \\____\/\\___\/ \n                                                                          \n]';
var term = $('#term').terminal(function(command, term) {
    if (command.match(/^\s*exit\s*$/)) {
        exit();
    } else if (command !== '') {
        try {
            var result = window.eval(command);
            if (result && result instanceof $.fn.init) {
                term.echo('<#jQuery>');
            } else if (result && typeof result === 'object') {
                tree(result);
            } else if (result && typeof result === 'function') {
                result();
            } else if (result !== undefined) {
                term.echo(new String(result));
            }
        } catch(e) {
            term.error(new String(e));
        }
    }
}, {
    name: 'charles_monroe',
    onResize: set_size,
    exit: false,
    // detect iframe codepen preview
    enabled: $('body').attr('onload') === undefined,
    onInit: function() {
        set_size();
        this.echo('Type [[b;#fff;]menu] to see a list of available commands.');
        // this.echo('Type and execute [[b;#fff;]grab()] function to get the scre' +
        //           'enshot from your camera');
        this.echo('Type [[b;#fff;]clear] to clear all messages.');
    },
    onClear: function() {
        console.log(this.find('video').length);
        this.find('video').map(function() {
            console.log(this.src);
            console.log(this.greetings);
            this.echo(this.greetings);
            return this.src;
        });
    },
    prompt: 'cm> ',
    greetings: greet,
    clear: false,
    pauseEvents: false,
    keydown : function (e, term) {
        console.log(e, term);
        if (e.which == "67" && e.ctrlKey){
            console.log("need to stop");
            clearTimeout(timeOut);
            term.resume();
            return false;
        }
    }
});
// for codepen preview
if (!term.enabled()) {
    term.find('.cursor').addClass('blink');
}
function set_size() {
    // for window height of 170 it should be 2s
    var height = $(window).height();
    var width = $(window).width()
    var time = (height * 2) / 170;
    scanlines[0].style.setProperty("--time", time);
    tv[0].style.setProperty("--width", width);
    tv[0].style.setProperty("--height", height);
}

function tree(obj) {
    term.echo(treeify.asTree(obj, true, true));
}
var constraints = {
    audio: false,
    video: {
        width: { ideal: 1280 },
        height: { ideal: 1024 },
        facingMode: "environment"
    }
};
var acceptStream = (function() {
    return 'srcObject' in document.createElement('video');
})();
function mirror() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        term.pause();
        var media = navigator.mediaDevices.getUserMedia(constraints);
        // TODO: this will create memory leaks when resize Object url will not be revoked
        media.then(function(mediaStream) {
            term.resume();
            var stream;
            if (!acceptStream) {
                stream = window.URL.createObjectURL(mediaStream);
            } else {
                stream = mediaStream;
            }
            term.echo('<video data-play="true" class="self"></video>', {
                raw: true,
                finalize: function(div) {
                    var video = div.find('video');
                    if (!video.length) {
                        return;
                    }
                    if (acceptStream) {
                        video[0].srcObject = stream;
                    } else {
                        video[0].src = stream;
                    }
                    if (video.data('play')) {
                        video[0].play();
                    }
                }
            });
        });
    }
}
var play = function() {
    var video = term.find('video').slice(-1);
    if (video.length) {
        video[0].play();
    }
}
function pause() {
    term.find('video').each(function() {
        this.pause(); 
    });
}

function snap() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        term.pause();
        var media = navigator.mediaDevices.getUserMedia(constraints);
        media.then(function(mediaStream) {
            const mediaStreamTrack = mediaStream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(mediaStreamTrack);
            return imageCapture.takePhoto();
        }).then(function(blob) {
            term.echo('<img src="' + URL.createObjectURL(blob) + '" class="self"/>', {
                raw: true,
                finialize: function(div) {
                    div.find('img').on('load', function() {
                        URL.revokeObjectURL(this.src);
                    });
                }
            }).resume();
        }).catch(function(error) {
            term.error('Device Media Error: ' + error);
        });
    }
}
async function pictuteInPicture() {
    var [video] = $('video');
    try {
        if (video) {
            if (video !== document.pictureInPictureElement) {
                await video.requestPictureInPicture();
            } else {
                await document.exitPictureInPicture();
            }
        }
  } catch(error) {
      term.error(error);
  }
}
function clear() {
    term.reset();
}
function getAge(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

var menu = {
    "[[b;#fff;]about]" : "Who am I?",
    "[[b;#fff;]links]" : "Where am I?",
    "[[b;#fff;]contact]" : "Hello World",
    "my innocent ____" : "Easter Eggs",
}

var about = {
    "name" : "[[b;#fff;]Charles Monroe]",
    "age" : "[[b;#fff;]" + getAge("1986/12/06") + "]",
    "location" : "[[b;#fff;]Athens, Greece]",
    "occupation" : "[[b;#fff;]Music, Programming]"
}

var links = {
    "facebook" : "https://www.facebook.com/charlesmonroemusic",
    "youtube" : "http://www.youtube.com/channel/UChRh9jIZGZIO95fzivtCsbQ",
    "soundcloud" : "http://www.soundcloud.com/charlesmonroecloud",
    "instagram" : "http://www.instagram.com/charlesmonroeofficial"
}

var contact = {
    "mail" : "charlesmonroeofficial@gmail.com",
    "phone" : "[[b;#fff;](+30)6944641722]"
}

var girl = {
    "[[b;#fff;]logo]" : "Hat Power",
    "[[b;#fff;]mirror]" : "Who are you?",
    "[[b;#fff;]pause]" : "Freeze",
    "[[b;#fff;]play]" : "Un-Freeze",
    "[[b;#fff;]snap]" : "Selfie?",
    "[[b;#fff;]delorean]" : "Time Travel",
    "[[b;#fff;]space]" : "C'mon, Michael! It's game time!"
}

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    delete girl["[[b;#fff;]mirror]"];
    delete girl["[[b;#fff;]pause]"];
    delete girl["[[b;#fff;]play]"];
    delete girl["[[b;#fff;]snap]"];
}

function logo() {
    term.echo($('<img width="350" src="./index_files/logo.png">'));
}

function delorean(delay) {
   term.pause();

   var frames = 
        [
        "[[b;#fff;]Press Control + C to Cancel ... \n",
        "[[b;#fff;]Default delay is 5000ms. Use delorean(delay) to adjust it ... \n",
        "[[b;#fff;]International Association of Time Travelers: Members’ Forum]",
        "[[b;#fff;]Subforum: Europe – Twentieth Century – Second World War]",
        "[[b;#fff;]Page 263]",
        "\n",
        "[[b;#fff;]11/15/2104]",
        "[[i;#fff;]At 14:52:28, FreedomFighter69 wrote:]",
        "Reporting my first temporal excursion since joining IATT: have just returned from 1936 Berlin, having taken the place of one of Leni Riefenstahl’s cameramen and assassinated Adolf Hitler during the opening of the Olympic Games. Let a free world rejoice!",
        "\n",
        "[[i;#fff;]At 14:57:44, SilverFox316 wrote:]",
        "Back from 1936 Berlin; incapacitated FreedomFighter69 before he could pull his little stunt. Freedomfighter69, as you are a new member, please read IATT Bulletin 1147 regarding the killing of Hitler before your next excursion. Failure to do so may result in your expulsion per Bylaw 223.",
        "\n",
        "[[i;#fff;]At 18:06:59, BigChill wrote:]",
        "Take it easy on the kid, SilverFox316; everybody kills Hitler on their first trip. I did. It always gets fixed within a few minutes, what’s the harm?",
        "\n",
        "[[i;#fff;]At 18:33:10, SilverFox316 wrote:]",
        "Easy for you to say, BigChill, since to my recollection you’ve never volunteered to go back and fix it. You think I’ve got nothing better to do?",
        "\n",
        "[[b;#fff;]11/16/2104]",
        "[[i;#fff;]At 10:15:44, JudgeDoom wrote:]",
        "Good news! I just left a French battlefield in October 1916, where I shot dead a young Bavarian Army messenger named Adolf Hitler! Not bad for my first time, no? Sic semper tyrannis!",
        "\n",
        "[[i;#fff;]At 10:22:53, SilverFox316 wrote:]",
        "Back from 1916 France I come, having at the last possible second prevented Hitler’s early demise at the hands of JudgeDoom and, incredibly, restrained myself from shooting JudgeDoom and sparing us all years of correcting his misguided antics. READ BULLETIN 1147, PEOPLE!",
        "\n",
        "[[i;#fff;]At 15:41:18, BarracksRoomLawyer wrote:]",
        "Point of order: issues related to Hitler’s service in the Bavarian Army ought to go in the World War I forum.",
        "\n",
        "[[b;#fff;]11/21/2104]",
        "[[i;#fff;]At 02:21:30, SneakyPete wrote:]",
        "Vienna, 1907: after numerous attempts, have infiltrated the Academy of Fine Arts and facilitated Adolf Hitler’s admission to that institution. Goodbye, Hitler the dictator; hello, Hitler the modestly successful landscape artist! Brought back a few of his paintings as well, any buyers?",
        "\n",
        "[[i;#fff;]At 02:29:17, SilverFox316 wrote:]",
        "All right; that’s it. Having just returned from 1907 Vienna where I secured the expulsion of Hitler from the Academy by means of an elaborate prank involving the Prefect, a goat, and a substantial quantity of olive oil, I now turn my attention to our newer brethren, who, despite rules to the contrary, seem to have no intention of reading Bulletin 1147 (nor its Addendum, Alternate Means of Subverting the Hitlerian Destiny, and here I’m looking at you, SneakyPete). Permit me to sum it up and save you the trouble: no Hitler means no Third Reich, no World War II, no rocketry programs, no electronics, no computers, no time travel. Get the picture?",
        "\n",
        "[[i;#fff;]At 02:29:49, SilverFox316 wrote:]",
        "PS to SneakyPete: your Hitler paintings aren’t worth anything, schmuck, since you probably brought them directly here from 1907, which means the paint’s still fresh. Freaking n00b.",
        "\n",
        "[[i;#fff;]At 07:55:03, BarracksRoomLawyer wrote:]",
        "Amen, SilverFox316. Although, point of order, issues relating to early 1900s Vienna should really go in that forum, not here. This has been a recurring problem on this forum.",
        "\n",
        "[[b;#fff;]11/26/2104]",
        "[[i;#fff;]At 18:26:18, Jason440953 wrote:]",
        "SilverFox316, you seem to know a lot about the rules; what are your thoughts on traveling to, say, Braunau, Austria, in 1875 and killing Alois Hitler before he has a chance to father Adolf? Mind you, I’m asking out of curiosity alone, since I already went and did it.",
        "\n",
        "[[i;#fff;]At 18:42:55, SilverFox316 wrote:]",
        "Jason440953, see Bylaw 7, which states that all IATT rulings regarding historical persons apply to ancestors as well. I post this for the benefit of others, as I already made this clear to young Jason in person as I was dragging him back from 1875 by his hair. Got that? No ancestors. (Though if anyone were to go back to, say, Moline, Illinois, in, say, 2080 or so, and intercede to prevent Jason440953’s conception, I could be persuaded to look the other way.)",
        "\n",
        "[[i;#fff;]At 21:19:17, BarracksRoomLawyer wrote:]",
        "Point of order: discussions of nineteenth–century Austria and twenty–first–century Illinois should be confined to their respective forums.",
        "\n",
        "[[b;#fff;]12/01/2104]",
        "[[i;#fff;]At 15:56:41, AsianAvenger wrote:]",
        "FreedomFighter69, JudgeDoom, SneakyPete, Jason440953, you’re nothing but a pack of racists. Let the light of righteousness shine upon your squalid little viper’s nest!",
        "\n",
        "[[i;#fff;]At 16:40:17, BigTom44 wrote:]",
        "Well, here we frickin’ go.",
        "\n",
        "[[i;#fff;]At 16:58:42, FreedomFighter69 wrote:]",
        "Racist? For killing Hitler? WTF?",
        "\n",
        "[[i;#fff;]At 17:12:52, SaucyAussie wrote:]",
        "AsianAvenger, you’re not rehashing that whole Nagasaki issue again, are you? We just got everyone calmed down from last time.",
        "\n",
        "[[i;#fff;]At 17:22:37, LadyJustice wrote:]",
        "I’m with SaucyAussie. AsianAvenger, you’re making even less sense than usual. What gives?",
        "\n",
        "[[i;#fff;]At 18:56:09, AsianAvenger wrote:]",
        "What gives is everyone’s repeated insistence on a course of action which, even if successful, would only save a few million Europeans. It would be no more trouble to travel to Fuyuanshui, China, in 1814 and kill Hong Xiuquan, thus preventing the Taiping Rebellion of the mid–nineteenth century and saving fifty million lives in the process. But, hey, what are fifty million yellow devils more or less, right, guys? We’ve got Poles and Frenchmen to worry about.",
        "\n",
        "[[i;#fff;]At 19:01:38, LadyJustice wrote:]",
        "Well, what’s stopping you from killing him, AsianAvenger?",
        "\n",
        "[[i;#fff;]At 19:11:43, AsianAvenger wrote:]",
        "Only to have SilverFox316 undo my work? What’s the point?",
        "\n",
        "[[i;#fff;]At 19:59:23, SilverFox316 wrote:]",
        "Actually, it seems like a pretty good idea to me, AsianAvenger. No complications that I can see.",
        "\n",
        "[[i;#fff;]At 20:07:25, Big Chill wrote:]",
        "Go for it, man.",
        "\n",
        "[[i;#fff;]At 20:11:31, AsianAvenger wrote:]",
        "Very well. I shall return in mere moments, the savior of millions!",
        "\n",
        "[[i;#fff;]At 20:14:17, LadyJustice wrote:]",
        "Just checked the timeline; congrats on your success, AsianAvenger!",
        "\n",
        "[[b;#fff;]12/02/2104]",
        "[[i;#fff;]At 10:52:53, LadyJustice wrote:]",
        "AsianAvenger?",
        "\n",
        "[[i;#fff;]At 11:41:40, SilverFox316 wrote:]",
        "AsianAvenger, we need your report, buddy.",
        "\n",
        "[[i;#fff;]At 17:15:32, SilverFox316 wrote:]",
        "Okay, apparently AsianAvenger was descended from Hong Xiuquan. Any volunteers to go back and stop him from negating his own existence?",
        "\n",
        "[[b;#fff;]12/10/2104]",
        "[[i;#fff;]At 09:14:44, SilverFox316 wrote:]",
        "Anyone?",
        "\n",
        "[[i;#fff;]At 09:47:13, BarracksRoomLawyer wrote:]",
        "Point of order: this discussion belongs in the Qing Dynasty forum. We’re adults; can we keep sight of what’s important around here?",
        "\nType [[b;#fff;]clear] to delete the messages...",
        "\n"
    ];
//    var frames = [];
   var LINES_PER_FRAME = 1;
   if(delay == null || delay == undefined) { 
    delay = 5000;
   }
   var stop = false;
   var nextDelay;
   //star_wars is array of lines from 'js/star_wars.js'
//    var lines = journal.length;
//    for (var i=0; i<lines; i+=LINES_PER_FRAME) {
//        frames.push(journal.slice(i, i+LINES_PER_FRAME));
//    }
   var i = 0;
   function display() {
       if (i == frames.length - 1) {
           stop = true;
       }
       if (!stop) {
           term.echo(frames[i++], {keepWords: true});
           nextDelay = (frames[i].indexOf("[[") >= 0 || frames[i].indexOf("\n"))? 500 : delay;
           timeOut = setTimeout(display, nextDelay);
       } else {
           term.resume();
       } 
   }
   display();
}

cssVars(); // ponyfill