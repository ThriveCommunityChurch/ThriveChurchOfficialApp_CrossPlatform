/**
 * Expo Config Plugin: withPodsDeploymentTarget
 *
 * Raises any CocoaPods target whose IPHONEOS_DEPLOYMENT_TARGET is below the app's minimum.
 * Xcode 27 refuses to build targets below iOS 15.0; some Pods (Stripe, Sentry, SDWebImage,
 * nanopb, ...) still declare 9.0-13.4. Persists across `expo prebuild --clean`.
 */

const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# withPodsDeploymentTarget';

const snippet = (minimum) => `    ${MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        current = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || Gem::Version.new(current) < Gem::Version.new('${minimum}')
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${minimum}'
        end
      end
    end
`;

const withPodsDeploymentTarget = (config, { minimum = '15.1' } = {}) =>
  withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfile = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      if (contents.includes(MARKER)) return config;

      const hook = /^(\s*post_install do \|installer\|\n)/m;
      if (!hook.test(contents)) {
        throw new Error('withPodsDeploymentTarget: no post_install block found in the Podfile');
      }
      contents = contents.replace(hook, `$1${snippet(minimum)}`);
      fs.writeFileSync(podfile, contents);
      console.log(`Pods IPHONEOS_DEPLOYMENT_TARGET floor set to ${minimum}`);
      return config;
    },
  ]);

module.exports = withPodsDeploymentTarget;
