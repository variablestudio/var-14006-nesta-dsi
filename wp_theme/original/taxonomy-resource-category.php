<?php get_header(); ?>


<div id="page">
	<div id="content">
 	  <h1><?php single_cat_title( '', true ); ?></h1>

<div class="grid">
	<?php if (have_posts()) : ?>
		<?php while (have_posts()) : the_post(); ?>



<div class="grid-item">
<a href="<?php the_permalink() ?>"><?php
			if ( has_post_thumbnail() ) {
			the_post_thumbnail( 'blog' );
			} else { echo'<img src="http://stage11.clientden.com/wp-content/themes/digitalsocial/images/600.jpg" alt="photo" />';}
			?></a>
<h2><a href="<?php the_permalink() ?>"><?php the_title(); ?></a></h2>
<a href="<?php the_permalink() ?>">Read more &raquo;</a>
</div>



	<?php endwhile; ?>
	<?php else : ?>
	<?php endif; ?>
</div>

<div class="paged"><?php if(function_exists('wp_pagenavi')) { wp_pagenavi(); } ?></div>
</div>
<?php get_sidebar('resource'); ?>
</div>

<?php get_footer();?>
