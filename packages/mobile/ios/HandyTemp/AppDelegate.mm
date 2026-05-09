#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <Firebase.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSLog(@"🔥 [AppDelegate] Calling [FIRApp configure]...");
  [FIRApp configure];
  NSLog(@"🔥 [AppDelegate] Firebase configured successfully. Default app: %@", [FIRApp defaultApp]);

  self.moduleName = @"HandyPlatformApp";
  self.initialProps = @{};
  self.dependencyProvider = [RCTAppDependencyProvider new];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
