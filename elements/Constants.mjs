/*!
 * Constants 
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import path from 'path';

export const WEBBASE = Symbol('webbase');
export const INDEX = Symbol('index');
export const PATH = Symbol('path')

export const ROOT_DIR = process.cwd();
export const SITE_DIR = path.join(ROOT_DIR, 'public');
export const STUDIO_DIR = path.join(ROOT_DIR, 'studio');
