# Correção de segurança de papéis

- [x] Restringir INSERT de user_roles a treinadores, mantendo SELECT, DELETE e o trigger de registo.
- [x] Verificar chamadas no código e ausência de política UPDATE.
- [x] Testar recusa de autopromoção, perfil e player no registo, e atribuição por treinador (quatro testes passaram).
- [x] Apresentar políticas finais e sugerir proteção do último treinador sem a implementar.