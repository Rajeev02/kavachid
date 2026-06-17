import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Synchronous method: Fast JSI call directly into Kotlin/Swift
  getDpopHeaders(url: string, method: string): string;

  // Asynchronous network operations
  login(identifier: string, password: string): Promise<string>;
  logout(): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNKavachModule');
