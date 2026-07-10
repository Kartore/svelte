import { error } from '@sveltejs/kit';

import { adapterModules } from 'virtual:kartore-adapter';

import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const matchedPage = adapterModules
		.flatMap((module) =>
			(module.pages ?? []).map((page) => ({
				module,
				page
			}))
		)
		.find(({ module, page }) => params.modulePath === `${module.id}/${page.path}`);

	if (!matchedPage) error(404, 'Not found');

	return { component: matchedPage.page.component };
};
