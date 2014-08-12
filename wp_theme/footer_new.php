</div>

<div class="footer">
	<div class="container">
		<div class='logos'>
			<a href="http://www.nesta.org.uk/" title="Nesta"><img alt="Nesta" src="http://digitalsocial.eu/assets/partners/white/nesta-6a9b5fe999e8323b379ccc0d8e70290f.png" /></a>
			<a href="http://www.esade.edu/" title="Esade Business School"><img alt="Esade" src="http://digitalsocial.eu/assets/partners/white/esade-b6eb89a49bfd702310d4e963f5f83695.png" /></a>
			<a href="http://www.iri.centrepompidou.fr/en/" title="Institut de Recherche et d&#x27;Innovation"><img alt="Iri" src="http://digitalsocial.eu/assets/partners/white/iri-51848d69e8fcb9fa8c55089f574e311c.png" /></a>
			<a href="http://waag.org/en" title="Waag Society"><img alt="Waag" src="http://digitalsocial.eu/assets/partners/white/waag-f1d052f43133268eaf2e13090a0b4bf1.png" /></a>
		</div>
		<div class='logos'>
			<a href="http://futureeverything.org/" title="FutureEverything"><img alt="Future-everything" src="http://digitalsocial.eu/assets/partners/white/future-everything-2f261cf2d078264179fd82b21e5927b7.png" /></a>
			<a href="http://www.swirrl.com/" title="Swirrl"><img alt="Swirrl" src="http://digitalsocial.eu/assets/partners/white/swirrl-63c559d4c17da1273922275c1284d09b.png" /></a>
			<a href="http://www.interago.co.uk" title="Interago"><img alt="Interago" src="http://content.digitalsocial.eu/wp-content/uploads/2014/08/interago116.png" /></a>
			<a href="http://variable.io" title="Variable"><img alt="Variable" src="http://content.digitalsocial.eu/wp-content/uploads/2014/08/variableWhite116.png" /></a>
		</div>

		<div class='contact'>
			<a href="http://twitter.com/digi_si"><img alt="Twitter" src="http://digitalsocial.eu/assets/footer/twitter-1e6b15cd058f6a239e23bc95c0785085.png" /></a>
			<a href="mailto:contact@digitalsocial.eu"><img alt="Email" src="http://digitalsocial.eu/assets/footer/email-2f6fbdd1737e4f5b5933354a0bd8be38.png" /></a>
		</div>
		<div class='credits'>
			<div class='copy'>
				<a class='cc' href='http://creativecommons.org/licenses/by-nc-sa/4.0/'><img alt="Cc" src="http://digitalsocial.eu/assets/cc-8a7adda858c9417c7ca9da7a74a159a0.png" /></a>
				2014 Digital Social Innovation
			</div>
			<div class='links'>
				<a href='http://data.digitalsocial.eu'>Open Data</a>
				<a href='/terms'>Terms of Use</a>
				<a href='/privacy'>Privacy &amp; Cookies</a>
			</div>
		</div>
	</div>
</div>

<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="<?php bloginfo('template_directory'); ?>/js/scripts.js"></script>
<script>
	$(".nav-bar .search a").click( function(e) {
		e.preventDefault();
		$(".nav-bar .search input").toggle().focus();
	});

	$(".nav-bar .search").click(function(e) {
		e.stopPropagation();
	});

	$("html").click(function() {
		$(".nav-bar .search input").hide();
	});
</script>
<?php wp_footer();?>
</body>

</html>
