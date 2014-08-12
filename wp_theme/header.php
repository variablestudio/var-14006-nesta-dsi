<!DOCTYPE html>
<html lang="en">
<head>
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
	<meta charset="UTF-8">
	<title>Digital Social Innovation | <?php wp_title('| ',true,'right'); ?></title>
	<style type="text/css">
		@font-face {font-family: 'Scene Std Bold';src: url('http://digitalsocial.eu/webfonts/2B4DC2_0_0.eot');src: url('http://digitalsocial.eu/webfonts/2B4DC2_0_0.eot?#iefix') format('embedded-opentype'),url('http://digitalsocial.eu/webfonts/2B4DC2_0_0.woff') format('woff'),url('http://digitalsocial.eu/webfonts/2B4DC2_0_0.ttf') format('truetype');}
		@font-face {font-family: 'Scene Std Medium';src: url('http://digitalsocial.eu/webfonts/2B4DC2_1_0.eot');src: url('http://digitalsocial.eu/webfonts/2B4DC2_1_0.eot?#iefix') format('embedded-opentype'),url('http://digitalsocial.eu/webfonts/2B4DC2_1_0.woff') format('woff'),url('http://digitalsocial.eu/webfonts/2B4DC2_1_0.ttf') format('truetype');}
	</style>
	<link rel="stylesheet" href="<?php bloginfo('template_directory'); ?>/style.css" type="text/css" media="screen" />
	<meta content="authenticity_token" name="csrf-param" />
	<meta content="8gevuJo88cmM/FmKPVwxf2hxWsgx18PkQiRPWPGP9ic=" name="csrf-token" />

	<!--[if IE]><script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script><![endif]-->
	<link rel="alternate" type="application/rss+xml" title="<?php bloginfo('name'); ?> RSS" href="<?php bloginfo('rss2_url'); ?>" />
	<link rel="pingback" href="<?php bloginfo('pingback_url'); ?>" />
	<?php if ( is_singular() ) wp_enqueue_script( 'comment-reply' ); ?>
	<link rel="shortcut icon" href="http://digitalsocial.eu/favicon.ico" type="image/x-icon" />
	<?php wp_head();?>
</head>

<body>

<div id='header'>
<div id='header-content'>
<div id='user-info'>
<a class='current-user' href="/users/sign_in">Log in</a> 
| 
<a href="/organisations/build/new_user">Register your organisation</a>
</div>
</div>
</div>

<div class='container'>

<div class='nav-bar'>

<?php wp_nav_menu( array( 'theme_location' => 'first-menu', 'container' => '', 'items_wrap' => '<ul class="header-links">%3$s</ul>' ) ); ?>

<a href='http://digitalsocial.eu/'><img alt="Dsi-logo-small" src="http://digitalsocial.eu/assets/logo/white/dsi-8c1449cf94fe315a853fd9a5d99eaf45.png" /></a>

<div class='search'>


<a href='#'>
<i class='icon-search' style='font-size: 20px;'></i>
</a>
<form action='http://digitalsocial.eu/organisations-and-projects' method='get'>
<input id="q" name="q" placeholder="Search Organisation or Project" style="display: none;" type="text" />
</form>
</div>




<?php if ( is_page('Community')) { ;?>
<div class='hr hr2 hr-full' style='clear: both; float: left; visibility: hidden;'></div>
<div class='subnav clearfix'>
<?php wp_nav_menu( array( 'theme_location' => 'second-menu', 'container' => '', 'items_wrap' => '<ul class="header-links">%3$s</ul>' ) ); ?>
</div>
<div class='hr hr-full'></div>

<?php }
elseif ( is_page('About') || is_page('Contact') || is_page('FAQs') ) { ;?>
<div class='hr hr2 hr-full' style='clear: both; float: left; visibility: hidden;'></div>
<div class='subnav clearfix'>
<?php wp_nav_menu( array( 'theme_location' => 'fourth-menu', 'container' => '', 'items_wrap' => '<ul class="header-links">%3$s</ul>' ) ); ?>
</div>
<div class='hr hr-full'></div>

<?php }
elseif ( is_home() ) {echo "<div class='hr hr-full'></div>";}

elseif ( is_page('Resources')
|| is_tax('resource-category', $term = 'research') || has_term( 'research', 'resource-category' )
|| is_tax('resource-category', $term = 'projects-material') || has_term( 'projects-material', 'resource-category' )
|| is_tax('resource-category', $term = 'funding-and-support') || has_term( 'funding-and-support', 'resource-category' )){;?>
<div class='hr hr2 hr-full' style='clear: both; float: left; visibility: hidden;'></div>
<div class='subnav clearfix'>
<?php wp_nav_menu( array( 'theme_location' => 'third-menu', 'container' => '', 'items_wrap' => '<ul class="header-links">%3$s</ul>' ) ); ?>
</div>
<div class='hr hr-full'></div>

<?php }

else {echo "<div class='hr hr-full'></div>";}?>





</div>