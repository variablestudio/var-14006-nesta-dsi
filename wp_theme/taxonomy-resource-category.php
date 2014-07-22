<?php get_header(); ?>
<?php $slug = $wp_query->queried_object->slug ?>

<div id="page" class="<?php echo $slug ?>">
	<?php if ($slug != "research") { ?>
		<h1> <?php single_cat_title( '', true ); ?> </h1>
	<?php } ?>

	<div class="description">
		<?php echo term_description() ?>
	</div>

	<?php if ($slug == "funding-and-support") { ?>
		<div class="items">
			<?php if (have_posts()) { ?>
				<h1>Opportunities</h1>

				<?php
					while (have_posts()) {
						the_post();
				?>

					<div class="item">
							<?php if ( has_post_thumbnail() ) { the_post_thumbnail( 'blog' ); } ?>

							<div class="item-content">
									<?php $custom_fields = get_post_custom(); ?>

									<?php
										if (array_key_exists('deadline', $custom_fields)) {
											$deadline = $custom_fields['deadline'];
											echo "<span class=\"deadline\">Closes " . $deadline[0] . "</span>";
										}
									?>

									<h4>
										<?php echo get_the_title() ?>
									</h4>

									<?php the_content() ?>

									<?php
										if (array_key_exists('apply-link', $custom_fields)) {
											$apply_link = $custom_fields['apply-link'];
											echo "<a class=\"apply-link\" href=\"" . $apply_link[0] . "\">Apply</a>";
										}
									?>
						</div>

						<div style="clear: both"></div>
					</div>

			<?php
					}
				}
			?>
		</div>

	<?php } else if ($slug == "research") { ?>
		<?php
			if (have_posts()) {
				$categories = array(
					"research-results" => "Resarch Results",
					"factsheet-and-postcard" => "Factsheet and postcard",
					"presentations" => "Presentations"
				);

				foreach ($categories as $category => $name) {
					echo "<div class=\"items\">";
					echo "<h1>" . $name . "</h1>";

					while (have_posts()) {
						the_post();

						$custom_fields = get_post_custom();
						$resource_type = $custom_fields['resource-type'];

						if ($resource_type[0] == $category) {
		?>
					<div class="item">
							<div class="item-content">
								<?php the_content() ?>
						</div>
					</div>
		<?php
						}
					}

					echo "</div>";
				}
			}
		?>
	<?php } ?>

	<div class="paged"><?php if(function_exists('wp_pagenavi')) { wp_pagenavi(); } ?></div>
</div>

<?php get_footer(); ?>
