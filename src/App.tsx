/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Editor } from './components/Editor';
import { AiComposer } from './components/AiComposer';

export default function App() {
  return (
    <div className="font-sans antialiased text-gray-900 bg-white">
      <Editor />
      <AiComposer />
    </div>
  );
}
