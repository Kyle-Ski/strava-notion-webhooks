# strava-notion-webhooks

## Abstract
This is a little express server that can connect to my strava account with the [Strava API](https://developers.strava.com/) and to a Notion database with the [Notion API](https://developers.notion.com/).
It can listen to the strava webhook for my account and update the notion database with that strava activity (adding if new, editing if it exists and deleting if it's deleted).
