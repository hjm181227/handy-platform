import { useContext } from 'react';
import { AlertProvider } from './AlertProvider';

// useAlert는 AlertProvider에서 export하므로 여기서는 re-export만 함
export { useAlert } from './AlertProvider';