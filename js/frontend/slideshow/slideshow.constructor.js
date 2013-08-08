undefined = function()
{
	var $    = jQuery,
		self = slideshow_jquery_image_gallery_script;

	/**
	 * Slideshow constructor
	 *
	 * @param $slideshow (jQuery)
	 */
	self.Slideshow = function($slideshow)
	{
		/** Element variables */
		this.$container        = $slideshow;
		this.$content          = this.$container.find('.slideshow_content');
		this.$views            = this.$container.find('.slideshow_view');
		this.$slides           = this.$container.find('.slideshow_slide');
		this.$controlPanel     = this.$container.find('.slideshow_controlPanel');
		this.$togglePlayButton = this.$controlPanel.find('.slideshow_togglePlay');
		this.$nextButton       = this.$container.find('.slideshow_next');
		this.$previousButton   = this.$container.find('.slideshow_previous');
		this.$pagination       = this.$container.find('.slideshow_pagination');
		this.$loadingIcon      = this.$container.find('.slideshow_loading_icon');

		/** Settings */
		this.ID = this.getID();

		if (isNaN(parseInt(this.ID, 10)))
		{
			return;
		}

		this.settings = window['SlideshowPluginSettings_' + this.ID];

		// Convert 'true' and 'false' to boolean values.
		$.each(this.settings, $.proxy(function(setting, value)
		{
			if (value == 'true')
			{
				this.settings[setting] = true;
			}
			else if (value == 'false')
			{
				this.settings[setting] = false;
			}
		}, this));

		/** Interchanging variables */
		this.$parentElement    = this.$container.parent();
		this.viewData         = [];
		this.viewIDs          = [];
		this.navigationActive = true;
		this.currentViewID    = undefined;
		this.currentWidth     = 0;
		this.visibleViews     = [];
		this.videoPlayers     = [];

		/** Timers */
		this.interval          = false;
		this.mouseEnterTimer   = false;
		this.invisibilityTimer = false;
		this.descriptionTimer  = false;

		/** Randomization */
		this.randomNextHistoryViewIDs     = [];
		this.randomPreviousHistoryViewIDs = [];
		this.randomAvailableViewIDs       = [];

		// Register slideshow
		self.registeredSlideshows.push(this.ID);

		$.each(this.$views, $.proxy(function(viewID, undefined){ this.viewIDs.push(viewID); }, this));

		this.currentViewID = this.getNextViewID();

		this.visibleViews = [this.currentViewID];

		// Initial size calculation of slideshow, doesn't recalculate views
		this.recalculate(false);

		// Initialize $viewData array as $viewData[ view[ slide{ 'imageDimension': '', 'loaded': 0 } ] ]
		// Add slideshow_currentView identifier class to the visible views
		// Recalculate views
		// Hide views out of the content area
		var hasFirstSlideLoaded = true;
		$.each(this.$views, $.proxy(function(viewID, view)
		{
			var $view = $(view);

			this.recalculateView(viewID);

			// Hide views, except for the one that's currently showing.
			if (viewID != this.visibleViews[0])
			{
				$view.css('top', this.$container.outerHeight(true));
			}
			else
			{
				$view.addClass('slideshow_currentView');
			}

			this.viewData[viewID] = [];

			$.each($view.find('.slideshow_slide'), $.proxy(function(slideID, slide)
			{
				var $slide = $(slide);

				this.viewData[viewID][slideID] = { 'imageDimension': '' };

				// Check if the image in this slide is loaded. The loaded value van have the following values:
				// -1: Slide is no image slide, 0: Not yet loaded, 1: Successfully loaded, 2: Unsuccessfully loaded
				if (this.settings['waitUntilLoaded'] &&
					$slide.hasClass('slideshow_slide_image'))
				{
					var $image = $slide.find('img');

					if ($image.length > 0)
					{
						$image.each($.proxy(function(undefined, image)
						{
							if (image.complete)
							{
								this.viewData[viewID][slideID].loaded = 1;
							}
							else
							{
								if (viewID === this.currentViewID)
								{
									hasFirstSlideLoaded = false;
								}

								this.viewData[viewID][slideID].loaded = 0;

								$image.load($.proxy(function()
								{
									this.viewData[viewID][slideID].loaded = 1;

									if (viewID === this.currentViewID &&
										this.isViewLoaded((viewID)))
									{
										this.firstStart();
									}
								}, this)).bind('error', $.proxy(function(){ this.viewData[viewID][slideID].loaded = 2; }, this));
							}
						}, this));
					}
					else
					{
						this.viewData[viewID][slideID].loaded = -1;
					}
				}
				else
				{
					this.viewData[viewID][slideID].loaded = -1;
				}
			}, this));
		}, this));

		// Recalculate visible views when window is loaded
		$(window).load($.proxy(function()
		{
			this.recalculateVisibleViews();
		}, this));

		// Check if intervalSpeed is greater than slideSpeed
		if (parseFloat(this.settings['intervalSpeed']) < parseFloat(this.settings['slideSpeed']) + 0.1)
		{
			this.settings['intervalSpeed'] = parseFloat(this.settings['slideSpeed']) + 0.1;
		}

		// Activate modules
		this.activateDescriptions();
		this.activateControlPanel();
		this.activateNavigationButtons();
		this.activatePagination();
		this.activatePauseOnHover();

		// Start slideshow
		if (!this.settings['waitUntilLoaded'] ||
			hasFirstSlideLoaded)
		{
			this.firstStart();
		}
	};
}();