// src/middleware/checkPermission.js
const permissionsConfig = require('../config/permissionsConfig');

module.exports = async function(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

    const routePath = req.route ? req.route.path : req.path;
    const routeKey = req.method + ' ' + routePath;
    const requiredPermission = permissionsConfig.protectedRoutes[routeKey];
    if (!requiredPermission) return next();

    const supabase = req.app.get('supabase');
    if (!supabase) return next();

    const resultUser = await supabase.from('usuarios').select('role').eq('id', userId).single();
    const user = resultUser.data;
    const userError = resultUser.error;

    if (userError || !user) return res.status(401).json({ error: 'Usuário não encontrado' });

    const resultPerms = await supabase.from('permissoes_usuario').select('tela').eq('usuario_id', userId);
    const perms = resultPerms.data;
    const userPermissions = perms ? perms.map(p => p.tela) : [];
    
    const hasAccess = permissionsConfig.checkAccess(user.role, userPermissions, requiredPermission);

    if (!hasAccess) {
      console.warn('[🚫] Acesso negado: usuário ' + userId + ' tentou acessar ' + routeKey);
      return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
    }

    next();
  } catch (err) {
    console.error('Erro no middleware de permissão:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};