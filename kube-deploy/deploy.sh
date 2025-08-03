#!/bin/bash -e
# Any commands which fail will cause the shell script to exit immediately
set -e

# See the commands executed in the command window
set -x

# Create Connection to Correct Kube Cluster
kubectl config set-cluster kube-cluster --server=$KUBE_URL --insecure-skip-tls-verify
kubectl config set-credentials kube-cluster --token="$KUBE_TOKEN"
kubectl config set-context kube-cluster --cluster=kube-cluster --user=kube-cluster
kubectl config use-context kube-cluster
kubectl config set-context --current --namespace=${KUBE_NAMESPACE}
echo "Checking cluster connection and permissions...." && kubectl get nodes --show-labels | grep environment=$CI_JOB_NAME

# Change working directory to this script location
cd "$(dirname "$0")"

# Create a timestamp to inject into the deployment to force redeployment everytime
export DEPLOY_TIMESTAMP=`date +'%s'`

# Set default container port 
if [[ -z $CONTAINER_PORT ]]; then
  export CONTAINER_PORT="80"
fi

# Check deployment variables exist
if [[ -z $APP_HOSTNAME || -z $DOCKER_SECRET ]]; then
  echo 'one or more  deployment variables are undefined'
  exit 1
fi

# Check gitlab ci variables exist
if [[ -z $KUBE_NAMESPACE || -z $CI_PROJECT_PATH_SLUG || -z $CI_ENVIRONMENT_SLUG ]]; then
  echo 'one or more gitlab ci variables are undefined'
  exit 1
fi

# Check DMZ variables exist and set deploy image
if [ "${CI_JOB_NAME}" == "staging-dmz" ] || [ "${CI_JOB_NAME}" == "production-dmz" ]; then
  if [[ -z $DMZ_DOCKER_SECRET || -z $DMZ_REGISTRY_USER || -z $DMZ_REGISTRY_PASSWORD || -z $DMZ_REGISTRY ]]; then
    echo 'One or more DMZ variables are undefined'
    exit 1
  else
    export DOCKER_SECRET=${DMZ_DOCKER_SECRET}
    export DEPLOY_IMAGE=${DMZ_DOCKER_IMAGE} 
  fi
else
  export DEPLOY_IMAGE=${INTERNAL_DOCKER_IMAGE}
fi

# Create Namespace if it doesn't already exist
kubectl create namespace ${KUBE_NAMESPACE} || true

# Replace variables and Deploy config files
for f in manifests/*.yml ; do envsubst < "$f" | kubectl apply -f - ; done

#for deploying services using helm, please use below config by uncomment and comment above "for" loop line.
#The Values.yaml built-in object provides access to the values passed into a chart.
#Ensure values.yaml is placed in the kube-deploy folder

#envsubst < "values.yaml" > "values-out.yaml"

#helm repo add bitnami https://charts.bitnami.com/bitnami
#helm upgrade --install -f values-out.yaml -n ${KUBE_NAMESPACE} nameofapplciation bitnami/nameofapplciation


