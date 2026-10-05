# Privacy

Drive Markdown Preview collects **no data**.

- File contents are fetched from Google Drive using your existing signed-in session, rendered in your browser, and discarded when you leave the page. Nothing is sent to the authors or any third party.
- The only stored data is your options (currently "load remote images"), kept in `chrome.storage.sync` (your Chrome profile).
- Permissions: `drive.google.com` and `drive.usercontent.google.com` (to detect and download the file you opened) and `storage`.
- If you enable "Load remote images", images referenced in a Markdown file are requested directly by your browser from their hosts, like any web page.
