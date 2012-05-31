/**
* A bookmarking tool that requires local storage and og tags
*
* v1.0.0 - Add, list, and remove bookmarks from a store
* v1.1.0 - Added callbacks for add and delete buttons, so the data can be saved to an external source as well
* v1.2.0 - Added ability to override which nodes are used for data, and allow parent nodes, so multiple nodes can be used on one page
* v1.3.0 - Allowed extra fields to be passed through, for things like shop items, or movies
* v1.4.0 - Made list view templated, so list templates can easily be set
* v1.5.0 - Paginated list view. The code to handle changing pages is not included, but the list view can now be called per page
*/
(function($) {
 
  /**
   * The bookmark tool
   */
  $.fn.bookmark = function(options) {
   
    // init default options
    var defaults = {
        storageName: 'ditt.to.bookmarks',
        perPage: 10,
        sort: 'date',
        buttonCallback: '',
          deleteCallback: '',
          parentNode: 'head',
          titleNode: 'meta[property="og:title"]',
          urlNode: 'meta[property="og:url"]',
          imageNode: 'meta[property="og:image"]',
          attributeName: 'content',
          defaultImage: 'default.png',
          extraVars: {},
          listTemplate: '<div class="bookmark"><a href="%url%" title="%title%"><img src="%image%" title="%title%"/></a><a class="bookmark-title" ' +
               'href="%url%" title="%title%">%title%</a><span class="bookmark-delete" data-url="%url%">Delete</span></div>'
    };
   
    // merge the passed options in to the defaults
    options = $.extend({}, defaults, options);
   
    // get the focus of the jquery function
    var $focus = $(this);
   
    // check for local storage working
    if (!localStorage) {
        return null;
    }
   
    /**
     * Inits the bookmark button
     *
     * @param node The jquery element to init as a bookmark button
     */
    function initBookmarkButton(node)
    {
        // add a click event that bookmarks stores the page's information
        $(node).bind('click.bookmark', function () {
            // init vars
            var data = {};
            data.date = new Date().getTime();
              
               // get title of the page
            data.title = $(this).closest(options.parentNode).find(options.titleNode).attr(options.attributeName);
               data.title = data.title ? data.title : $('title').html();
              
               // get the url of the page
            data.url = $(this).closest(options.parentNode).find(options.urlNode).attr(options.attributeName);
               data.url = data.url ? data.url : window.location.href;
               data.url = data.url.replace(/#$/, '');
              
               // get the image of the page. Get the first img if none set
            data.image = $(this).closest(options.parentNode).find(options.imageNode).attr(options.attributeName);
               data.image = data.image ? data.image : $(this).closest(options.parentNode).find('img').attr('src');
               data.image = typeof data.image !== 'undefined' ? data.image : null;
           
               // get the extra variables
               for (var name in options.extraVars) {
                    var value = $(this).closest(options.parentNode).find(options.extraVars[name]).attr(options.attributeName);
                    data[name] = value ? value : '';
               }
              
            // save in the local storage object
            addToLocalStorage(data);
           
            // run the callback if required
            if (options.buttonCallback) {
                options.buttonCallback(this, data);
            }
           
            // remove click event
            $(this).unbind('click.bookmark');
           
            return false;
        });
       
        // show the button
        $(node).show();
       
        return true;
    }
   
    /**
     * Adds an object of data to local storage. Stops duplicates
     *
     * @param data The data to store as an object
     */
    function addToLocalStorage(data)
    {
        // get the current data
        var current = getFromLocalStorage();
       
        // check for duplicates
        var found = checkBookmarkedPage(current, data.url);
       
        // replace the current with the new
          var updated = [];
          updated.push(data);
          for (var i = 0; i < current.length; i ++) {
               if (current[i].url != data.url)
               updated.push(current[i]);
          }
       
        // save the new object
        localStorage.setItem(options.storageName, JSON.stringify(updated));
    }
   
    /**
     * Deletes the bookmark with the given url
     *
     * @param url The url to remove from the bookmark
     */
    function removeFromLocalStorage(url)
    {
        // get the bookmarks from storage
        var current = getFromLocalStorage();
       
        // remove the required url
        var storage = [];
        for (key in current) {
               // if the url is not what we're removing, or the url is not undefined and we're trying to
               // remove the undefined then store it
            if (current[key].url != url && (typeof current[key].url != 'undefined' && url != 'undefined')) {
                storage.push(current[key]);
            }
        }
       
        // save the new object
          localStorage.setItem(options.storageName, JSON.stringify(storage));
    }
   
    /**
     * Gets the data from the local storage
     *
     * @return array An array of bookmarks
     */
    function getFromLocalStorage()
    {
        // get the current local storage
        var current = JSON.parse(localStorage.getItem(options.storageName));
        if (!current) {
            current = [];
        }
       
        return current;
    }
   
    /**
     * Checks if the current page is bookmarked
     *
     * @param current The data from local storage
     * @param compare The url to compare to local storage
     * @return true if found
     */
    function checkBookmarkedPage(current, compare)
    {
        // get the current pages
        if (!current) {
            current = getFromLocalStorage();
        }
       
        // check for duplicates
        var found = false;
        for (key in current) {
            if (current[key].url == compare) {
                found = true;
            }
        }
       
        return found;
    }
   
    /**
     * Lists the bookmarks that exist so far
     *
     * @param node The jquery element that will contain the list
     * @param offset A list offset, so that not you can paginate
     * @param limit The total number of bookmarks to return
     */
    function listBookmarks(node, offset, limit)
    {
          // init vars
          offset = offset ? offset : 0;
          limit = limit ? limit : 500;
         
        // get all bookmarks
        var bookmarks = getFromLocalStorage();
         
          // make sure the offset is less than the num. of bookmarks and the limit is valid
          offset = offset < bookmarks.length ? offset : bookmarks.length;
          limit = limit + offset < bookmarks.length ? limit + offset : bookmarks.length;
         
          // limit the bookmarks
          var limited = [];
          for (var j = offset; j < limit; j ++) {
               if (bookmarks[j]) {
                    limited.push(bookmarks[j]);
               }
          }
          bookmarks = limited;
         
        // loop though the bookmarks and add to the page
        for (var i = 0; i < bookmarks.length; i ++) {
               // use the default image if the image is broken
               bookmarks[i].image = bookmarks[i].image != null ? bookmarks[i].image : options.defaultImage;
              
            // build the template for the list of bookmarks
               var template = options.listTemplate.replace(/\%url\%/g, bookmarks[i].url).replace(/\%image\%/g, bookmarks[i].image);
               template = template.replace(/\%title\%/g, bookmarks[i].title);
              
               // loop through the extra fields and add them
               for (var name in options.extraVars) {
                    template = template.replace(new RegExp('\%' + name + '\%', 'g'), typeof bookmarks[i][name] != 'undefined' ? bookmarks[i][name] : '');
               }
              
               // add the bookmarks to the page
            var box = $(template);
            node.append(box);
        }
       
        // check if event already exists
        var click_events = $.data(node.get(0), 'events');
        var found_event = false;
        if (click_events) {
            for (i in click_events.click) {

                // if the namespace matches, then mark the event as found
                if (click_events.click[i].namespace == 'delete-bookmark') {
                    found_event = true;
                }
            }
        }
           
        // set an event to handle deletes only if not already set
        if (!found_event) {
            node.on('click.delete-bookmark', '.bookmark-delete', function() {
                // remove from local storage
                removeFromLocalStorage($(this).attr('data-url'));
               
                // empty the node
                node.empty();
           
                    // run the callback if required
                    if (options.deleteCallback) {
                         options.deleteCallback(this, data);
                    }
               
                // redraw the bookmarks
                listBookmarks(node);
            });
        }
    }
   
    /**
     * Counts the number of bookmarks
     *
     * @return The number of bookmarks
     */
    function countBookmarks () {
        // get all bookmarks
        var bookmarks = getFromLocalStorage();
       
        return bookmarks.length;
    }
   
    /**
     * The public functions for bookmarks
     */
    return {
        /**
         * Inits the bookmark buttons
         */
        initButtons: function () {
            // init the bookmark button on each element requested
            $focus.each(function (key, node) {
                initBookmarkButton(node);
            });
        },
     
        /**
         * Inits the list of bookmarked pages
          *
          * @param focus The jQuery selector for where to insert the list in to
          * @param offset A list offset, so that not you can paginate
          * @param limit The total number of bookmarks to return
         */
        list: function (focus, offset, limit) {
            listBookmarks($(focus), offset, limit);
        },
       
        /**
         * Counts the number of bookmarks
         */
        count: function () {
            return countBookmarks();
        },
       
        /**
         * Checks if the current page is bookmarked
         *
         * @return True if the url already exists
         */
        isBookmarked: function () {
            var url = $(options.urlNode).attr(options.attributeName);
            return checkBookmarkedPage(null, url);
        }
    };
  }

})(jQuery);
