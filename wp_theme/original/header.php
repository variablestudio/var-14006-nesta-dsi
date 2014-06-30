<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <meta charset="UTF-8">
  <title>Digital Social Innovation | <?php wp_title('| ',true,'right'); ?></title>
  <link rel="stylesheet" href="<?php bloginfo('template_directory'); ?>/style.css" type="text/css" media="screen" />
  <meta content="authenticity_token" name="csrf-param" />
  <meta content="8gevuJo88cmM/FmKPVwxf2hxWsgx18PkQiRPWPGP9ic=" name="csrf-token" />
  <script type="text/javascript" src="//use.typekit.net/sjd7euz.js"></script>
  <script type="text/javascript">try{Typekit.load();}catch(e){}</script>
  <!--[if IE]><script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script><![endif]-->
  <link rel="alternate" type="application/rss+xml" title="<?php bloginfo('name'); ?> RSS" href="<?php bloginfo('rss2_url'); ?>" />
  <link rel="pingback" href="<?php bloginfo('pingback_url'); ?>" />
  <?php if ( is_singular() ) wp_enqueue_script( 'comment-reply' ); ?>
  <link rel="shortcut icon" href="http://digitalsocial.eu/favicon.ico" type="image/x-icon" />
  <?php wp_head();?>
</head>



<body>

<div class='container'>
<div class='clearfix' id='header'>
<div id='user-info'>
<a class='current-user' href='http://digitalsocial.eu/users/sign_in'>
<i class='icon-login'></i>
Log In
</a>
</div>

<div class='nav-bar'>
<a href='http://digitalsocial.eu/'><img alt="Dsi-logo-small" src="<?php bloginfo('template_directory'); ?>/images/logo.png" /></a>

<?php wp_nav_menu( array( 'theme_location' => 'first-menu', 'container' => '', 'items_wrap' => '<ul class="header-links">%3$s</ul>' ) ); ?>

<div class='search'>
<form accept-charset="UTF-8" action="http://digitalsocial.eu/organisations" method="get"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /></div>
<div class='input'><input autocomplete="off" id="q" name="q" placeholder="Search for organisations..." size="22" type="text" /></div>
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

