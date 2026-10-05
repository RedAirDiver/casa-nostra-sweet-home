<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Process admin image uploads in the browser to a maximum width of 1000 pixels as 72-DPI JPEG before storage, so menu, gallery, and news images remain clear when opened larger.
- Keep menu prices as two nullable numeric columns while editing both through one validated `first/second` text field; this preserves existing public price formatting and data.
- Keep the printed-menu dish number in `item_number` independent of drag-and-drop `sort_order`, so reordering does not change the number guests use when ordering.
- Keep lunch and seasonal offer images on `special_offers` with an optional group name, so image-only menus and grouped campaigns share the existing admin and public ordering flow.
