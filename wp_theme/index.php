<?php get_header(); ?>


<div id="page" class="blog">
	<div id="content">
	<h1>Blog</h1>

	<?php if (have_posts()) : ?>
	<?php while (have_posts()) : the_post(); ?>

	<div class='page-intro'>
		<h2><a href="<?php the_permalink() ?>"><?php the_title(); ?></a></h2>
		<p class='subheader'>by <strong><?php the_author(); ?></strong> on <strong><?php the_time('dS, F, Y') ?></strong></p>
		<?php the_excerpt(); ?>
		<a class="read-more" href="<?php the_permalink() ?>">Read more &raquo;</a>
	</div>

		<?php endwhile; ?>
		<?php else : ?>
		<?php endif; ?>

		<div class="paged">
			<?php if(function_exists('wp_pagenavi')) { wp_pagenavi(); } ?>
		</div>
	</div>

	<?php get_sidebar('blog'); ?>
</div>

<?php get_footer(); ?>
