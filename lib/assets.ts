/*
  We need to remove the assets symlink and move the actual assets to the
  public folder. This is because we are externalizing the content to a
  separate repository.
*/
import fs from 'fs-extra'

fs.removeSync('public/assets')
fs.copySync('content/assets', 'public/assets')
