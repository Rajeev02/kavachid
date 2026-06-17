#import "KavachModule.h"
#import <React/RCTLog.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNKavachSpec.h"
#endif

// Import the Swift implementation (Xcode automatically generates this bridging header)
#if __has_include("KavachReactNative-Swift.h")
#import "KavachReactNative-Swift.h"
#else
#import <KavachReactNative/KavachReactNative-Swift.h>
#endif

@implementation KavachModule {
    KavachModuleImpl *impl;
}

RCT_EXPORT_MODULE(RNKavachModule)

- (instancetype)init {
    self = [super init];
    if (self) {
        impl = [[KavachModuleImpl alloc] init];
    }
    return self;
}

// Synchronous JSI implementation for Turbo Modules
#ifdef RCT_NEW_ARCH_ENABLED
- (NSString *)getDpopHeaders:(NSString *)url method:(NSString *)method {
    return [impl getDpopHeadersWithUrl:url method:method];
}

- (void)login:(NSString *)identifier password:(NSString *)password resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [impl loginWithIdentifier:identifier password:password resolve:resolve reject:reject];
}

- (void)logout:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [impl logoutWithResolve:resolve reject:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeKavachSpecJSI>(params);
}
#endif

@end
