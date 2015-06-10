/*
How to test:

1. Quit Firefox

2. Create a new profile for testing:

    https://support.mozilla.org/kb/profile-manager-create-and-remove-firefox-profiles

3. In the new profile folder, create a new file named "user.js", paste in the
contents of the following gist, and save:

    https://gist.github.com/jpetto/c850ed3f63328b85b9f1

4. Start Firefox using the new profile you created in step 2

5. Verify FxA settings have been updated:

    i: Navigate to about:config
    ii: Enter "identity.fxaccounts" into the search form - you should see the
        values specified in user.js listed. Here is a screenshot:

        https://cloudup.com/cNOziFzhTC4

6. Navigate to the first run page and sign up:

    /firefox/40.0/firstrun/
*/

;(function($, Mozilla) {
    'use strict';

    var hasVideo = $('#video').length > 0;
    var $videoFrame = $('#video-frame');
    var $videoTitle = $('#video-title');
    var $video = $('#firstrun-video');
    var $fxaFrame = $('#fxa');
    var fxaFrameTarget = document.querySelector('#fxa').contentWindow;
    var videoOnLoad = false;
    var resizeTimer;

    window.addEventListener('message', function (e) {
        console.log('received a message: ', e.origin);
        console.log('data: ', e.data);

        if (e.origin === 'https://stomlinson.dev.lcip.org') {
            var data = JSON.parse(e.data);
            switch (data.command) {
                case 'ping':
                    fxaFrameTarget.postMessage(e.data, 'https://stomlinson.dev.lcip.org');
                    break;
                case 'resize':
                    clearTimeout(resizeTimer);
                    // sometimes resizes come in bunches - only want to react to the last of a set
                    resizeTimer = setTimeout(function() {
                        $fxaFrame.css('height', data.data.height + 'px').addClass('visible');
                    }, 300);

                    break;
                case 'signup_must_verify':
                    // TODO: send some GA

                    break;
                case 'verification_complete':
                    // nothing to do here?

                    break;
                case 'login':
                    // nothing to do here?

                    break;
            }
        }
    }, true);

    // if locale has video, do A/B test
    if (hasVideo) {
        videoOnLoad = (Math.random() >= 0.5);

        // manual override to test videos
        if (window.location.href.indexOf('v=') !== -1) {
            var variation = window.location.href.split('v=')[1];

            videoOnLoad = (variation === '1') ? true : false;
        }

        window.dataLayer.push({
            'event': 'dataLayer-initialized',
            'page': {
                'category': 'firstrun-40.0',
                'variation': (videoOnLoad) ? '1' : '2'
            }
        });

        $video.on('play', function() {
            // GA track video play
            window.dataLayer.push({
                'event': 'firstrun-40.0-video',
                'interaction': 'start',
                'videoTitle': 'When its Personal Campaign Video'
            });
        }).on('ended', function() {
            // GA track video finish
            window.dataLayer.push({
                'event': 'firstrun-40.0-video',
                'interaction': 'finish',
                'videoTitle': 'When its Personal Campaign Video'
            });

            // take a little breath before closing modal
            setTimeout(function() {
                Mozilla.Modal.closeModal();
            }, 500);
        });
    }

    var showVideo = function(origin, autoplay) {
        var opts = {
            title: $videoTitle.text()
        };

        if (autoplay) {
            opts.onCreate = function() {
                // slight pause after modal opens
                setTimeout(function() {
                    $video[0].play();
                }, 250);
            };
        }

        Mozilla.Modal.createModal(origin, $videoFrame, opts);
    };

    // if showing video on page load, hide video copy/CTA and show video
    if (videoOnLoad) {
        $('#video').addClass('hidden');
        showVideo(document.documentElement, false);
    // if not showing video on page load, attach click listener to video CTA
    } else if (hasVideo) {
        $('#cta-video').on('click', function(e) {
            e.preventDefault();
            showVideo(this, true);
        });
    }
})(window.jQuery, window.Mozilla);
